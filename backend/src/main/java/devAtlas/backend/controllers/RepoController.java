package devAtlas.backend.controllers;



import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import  devAtlas.backend.dto.IndexStatusResponse;
import  devAtlas.backend.dto.RepositoryResponse;
import  devAtlas.backend.models.Repository;
import  devAtlas.backend.security.CurrentUser;
import  devAtlas.backend.service.RepoService;
import  devAtlas.backend.service.ai.RetrievedContext;
import  devAtlas.backend.service.ai.VisualizationService;
import  devAtlas.backend.service.indexing.IndexingService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/repos")
@RequiredArgsConstructor
public class RepoController {

    private final CurrentUser currentUser;
    private final RepoService repoService;
    private final IndexingService indexingService;
    private final VisualizationService visualizationService;

    @GetMapping
    public List<RepositoryResponse> list(
            @RequestParam(name = "refresh", defaultValue = "false") boolean refresh) {
        UUID userId = currentUser.require().getId();
        if (refresh) {
            return repoService.syncAndListRepos(userId);
        }
        return repoService.listStored(userId);
    }

    @GetMapping("/{id}")
    public RepositoryResponse get(@PathVariable UUID id) {
        UUID userId = currentUser.require().getId();
        return repoService.toResponse(repoService.requireOwned(id, userId));
    }

    @PostMapping("/{id}/index")
    public ResponseEntity<RepositoryResponse> index(@PathVariable UUID id) {
        UUID userId = currentUser.require().getId();
        Repository repo = indexingService.startIndexing(id, userId);
        indexingService.indexAsync(id, userId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body(repoService.toResponse(repo));
    }

    @DeleteMapping("/{id}/index")
    public ResponseEntity<Void> clearData(@PathVariable UUID id) {
        UUID userId = currentUser.require().getId();
        indexingService.clearData(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/status")
    public IndexStatusResponse status(@PathVariable UUID id) {
        UUID userId = currentUser.require().getId();
        return repoService.status(id, userId);
    }

    @PostMapping("/{id}/visualizations/generate")
    public ResponseEntity<Void> generateVisualizations(@PathVariable UUID id) {
        UUID userId = currentUser.require().getId();
        // Ensure user owns repo before generating
        repoService.requireOwned(id, userId);
        visualizationService.generateVisualizationsAsync(id);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/{id}/search")
    public RetrievedContext searchContext(@PathVariable UUID id, @RequestParam String query) {
        UUID userId = currentUser.require().getId();
        repoService.requireOwned(id, userId);
        return visualizationService.explainNode(id, query);
    }
}
