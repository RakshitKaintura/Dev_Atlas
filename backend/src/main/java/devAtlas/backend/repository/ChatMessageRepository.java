package devAtlas.backend.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import devAtlas.backend.models.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, UUID> {
    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(UUID sessionId);
    
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    void deleteBySessionIdIn(List<UUID> sessionIds);

    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Modifying
    void deleteBySessionId(UUID sessionId);
}
