package devAtlas.backend.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import devAtlas.backend.models.MessageRole;

public record ChatMessageResponse(
        UUID id,
        MessageRole role,
        String content,
        List<CitationDto> citations,
        Instant createdAt) {
}
