package devAtlas.backend.service.indexing;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import devAtlas.backend.models.IndexStatus;
import devAtlas.backend.models.Repository;
import devAtlas.backend.exception.BadRequestException;
import devAtlas.backend.exception.NotFoundException;
import devAtlas.backend.repository.RepositoryRepository;
import devAtlas.backend.repository.ChatSessionRepository;
import devAtlas.backend.repository.ChatMessageRepository;
import devAtlas.backend.models.ChatSession;
import devAtlas.backend.service.UserService;
import devAtlas.backend.service.ai.RagSettings;
import devAtlas.backend.service.github.GitHubApiClient;
import devAtlas.backend.service.github.GitHubRateLimiter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;


@Service
@RequiredArgsConstructor
@Slf4j
public class IndexingService {

    private static final int VECTOR_BATCH_SIZE = 32;
    private static final int PROGRESS_EVERY_N_FILES = 5;

    private final RepositoryRepository repositoryRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserService userService;
    private final GitHubApiClient gitHubApiClient;
    private final CodeFileFilter fileFilter;
    private final CodeChunker codeChunker;
    private final VectorStore vectorStore;
    private final GitHubRateLimiter rateLimiter;

    @Value("${app.indexing.max-file-bytes:102400}")
    private long maxFileBytes;

    @Transactional
    public Repository startIndexing(UUID repoId, UUID userId) {
        Repository repo = repositoryRepository.findByIdAndUserId(repoId, userId)
                .orElseThrow(() -> new NotFoundException("Repository not found"));

        if (repo.getIndexStatus() == IndexStatus.INDEXING) {
            throw new BadRequestException("Repository is already being indexed");
        }

        repo.setIndexStatus(IndexStatus.INDEXING);
        repo.setFilesProcessed(0);
        repo.setFilesTotal(0);
        repo.setChunkCount(0);
        repo.setErrorMessage(null);
        repo.setUpdatedAt(Instant.now());
        return repositoryRepository.save(repo);
    }

    @Async("indexingExecutor")
    public void indexAsync(UUID repoId, UUID userId) {
        try {
            doIndex(repoId, userId);
        } catch (Exception ex) {
            log.error("Indexing failed for repo {}", repoId, ex);
            markFailed(repoId, ex.getMessage());
        }
    }

    private void doIndex(UUID repoId, UUID userId) {
        Repository repo = repositoryRepository.findById(repoId)
                .orElseThrow(() -> new NotFoundException("Repository not found"));
        String token = userService.decryptAccessToken(userService.requiredById(userId));

        deleteExistingVectors(repoId.toString());

        updateStage(repoId, "SCANNING");
        Map<String, Object> tree = gitHubApiClient.getRepoTree(
                token, repo.getOwner(), repo.getName(), repo.getDefaultBranch());
        List<String> filePaths = listIndexableFiles(tree);

        updateStage(repoId, "READING");
        updateProgress(repoId, filePaths.size(), 0, 0, IndexStatus.INDEXING, null);

        List<Document> batch = new ArrayList<>();
        int processed = 0;
        int totalChunks = 0;

        for (String path : filePaths) {
            try {
                String content = gitHubApiClient.getFileContent(
                        token, repo.getOwner(), repo.getName(), path);
                
                // PostgreSQL text fields cannot contain null bytes (0x00)
                if (content != null) {
                    content = content.replace("\0", "");
                }

                List<Document> chunks = codeChunker.chunkFile(repoId.toString(), path, content);
                batch.addAll(chunks);
                totalChunks += chunks.size();
                
                if (batch.size() >= VECTOR_BATCH_SIZE) {
                    updateStage(repoId, "EMBEDDING");
                    throttleEmbedding(batch.size());
                    vectorStore.add(batch);
                    batch.clear();
                    updateStage(repoId, "CHUNKING"); // Revert back to chunking for next files
                }
            } catch (Exception ex) {
                log.warn("Skipping file {} in {}: {}", path, repo.getFullName(), ex.getMessage());
            }

            processed++;
            if (processed % PROGRESS_EVERY_N_FILES == 0 || processed == filePaths.size()) {
                updateProgress(repoId, filePaths.size(), processed, totalChunks, IndexStatus.INDEXING, null);
            }
            rateLimiter.pause();
        }

        if (!batch.isEmpty()) {
            throttleEmbedding(batch.size());
            vectorStore.add(batch);
        }

        markReady(repoId, filePaths.size(), processed, totalChunks, repo.getFullName());
    }

    /** GitHub tree API → paths of source files we want to embed. */
    @SuppressWarnings("unchecked")
    private List<String> listIndexableFiles(Map<String, Object> tree) {
        if (tree == null || tree.get("tree") == null) {
            return List.of();
        }

        List<Map<String, Object>> entries = (List<Map<String, Object>>) tree.get("tree");
        return entries.stream()
                .filter(entry -> "blob".equals(String.valueOf(entry.get("type"))))
                .filter(entry -> {
                    String path = String.valueOf(entry.get("path"));
                    long size = entry.get("size") instanceof Number n ? n.longValue() : 0L;
                    return fileFilter.isEligible(path, size, maxFileBytes);
                })
                .map(entry -> String.valueOf(entry.get("path")))
                .toList();
    }

    private void deleteExistingVectors(String repoId) {
        try {
            var filter = new FilterExpressionBuilder().eq(RagSettings.METADATA_REPO_ID, repoId).build();
            vectorStore.delete(filter);
        } catch (Exception ex) {
            log.warn("Could not delete existing vectors for repo {}: {}", repoId, ex.getMessage());
        }
    }

    @Transactional
    public void clearData(UUID repoId, UUID userId) {
        Repository repo = repositoryRepository.findByIdAndUserId(repoId, userId)
                .orElseThrow(() -> new NotFoundException("Repository not found"));

        // Clear vector store
        deleteExistingVectors(repoId.toString());

        // Clear repository fields
        repo.setIndexStatus(IndexStatus.PENDING);
        repo.setFilesProcessed(0);
        repo.setFilesTotal(0);
        repo.setChunkCount(0);
        repo.setIndexedAt(null);
        repo.setArchitectureDiagram(null);
        repo.setSchemaDiagram(null);
        repo.setFlowDiagram(null);
        repo.setWorkingFlowDiagram(null);
        repo.setUpdatedAt(Instant.now());
        repositoryRepository.save(repo);

        // Clear chat sessions and messages
        List<ChatSession> sessions = chatSessionRepository.findByUserIdAndRepositoryIdOrderByCreatedAtDesc(userId, repoId);
        List<UUID> sessionIds = sessions.stream().map(s -> s.getId()).toList();
        if (!sessionIds.isEmpty()) {
            chatMessageRepository.deleteBySessionIdIn(sessionIds);
            chatSessionRepository.deleteAll(sessions);
        }
        
        log.info("Cleared all data for repo {}", repoId);
    }

    private void updateProgress(UUID repoId, int filesTotal, int filesProcessed, int chunkCount, IndexStatus status, String errorMessage) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setFilesTotal(filesTotal);
            repo.setFilesProcessed(filesProcessed);
            repo.setChunkCount(chunkCount);
            repo.setIndexStatus(status);
            if (errorMessage != null) {
                repo.setErrorMessage(errorMessage);
            }
            repo.setUpdatedAt(Instant.now());
            repositoryRepository.save(repo);
        });
    }

    private void updateStage(UUID repoId, String stage) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setCurrentStage(stage);
            repositoryRepository.save(repo);
        });
    }

    private void throttleEmbedding(int batchSize) {
        try {
            // Gemini API free tier allows 100 requests per minute (~600ms per request).
            // Spring AI's embedContent might send 1 request per chunk in the batch.
            // We sleep 700ms per chunk to safely stay under the limit.
            Thread.sleep(batchSize * 700L);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    @Transactional
    protected void markReady(UUID repoId, int totalFiles, int processedFiles, int totalChunks, String fullName) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setIndexStatus(IndexStatus.READY);
            repo.setCurrentStage("COMPLETE");
            repo.setFilesTotal(totalFiles);
            repo.setFilesProcessed(processedFiles);
            repo.setChunkCount(totalChunks);
            repo.setIndexedAt(Instant.now());
            repo.setErrorMessage(null);
            repo.setUpdatedAt(Instant.now());
            repositoryRepository.save(repo);
        });
        log.info("Indexed {} files ({} chunks) for {}", processedFiles, totalChunks, fullName);
    }

    @Transactional
    protected void markFailed(UUID repoId, String message) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setIndexStatus(IndexStatus.FAILED);
            repo.setCurrentStage("ERROR");
            repo.setErrorMessage(message != null && message.length() > 2000
                    ? message.substring(0, 2000)
                    : message);
            repo.setUpdatedAt(Instant.now());
            repositoryRepository.save(repo);
        });
    }
}