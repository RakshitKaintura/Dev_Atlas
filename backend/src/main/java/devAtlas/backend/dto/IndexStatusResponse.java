package devAtlas.backend.dto;

import java.time.Instant;
import java.util.UUID;

import devAtlas.backend.models.IndexStatus;

public record IndexStatusResponse(
        UUID repositoryId,
        IndexStatus indexStatus,
        int filesTotal,
        int filesProcessed,
        int chunkCount,
        Instant indexedAt,
        String errorMessage,
        String currentStage) {
}