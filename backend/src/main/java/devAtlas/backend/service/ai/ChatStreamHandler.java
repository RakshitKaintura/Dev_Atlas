package devAtlas.backend.service.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.stereotype.Component;

import devAtlas.backend.dto.ChatMessageResponse;
import devAtlas.backend.dto.CitationDto;
import devAtlas.backend.models.ChatMessage;
import devAtlas.backend.models.MessageRole;
import devAtlas.backend.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Generation step: call Google GenAI via Spring AI and stream tokens to the browser over SSE.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ChatStreamHandler {

    private final ChatModel chatModel;
    private final ChatMessageRepository chatMessageRepository;
    private final CitationMapper citationMapper;

    public ChatMessageResponse generateReply(UUID sessionId,List<CitationDto> citations,String systemPrompt,String userPrompt) {
        try {
            String fullReply = ChatClient.builder(chatModel)
                    .build()
                    .prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .call()
                    .content();

            ChatMessage assistant = chatMessageRepository.save(ChatMessage.builder()
                    .sessionId(sessionId)
                    .role(MessageRole.ASSISTANT)
                    .content(fullReply)
                    .citations(citationMapper.toJson(citations))
                    .build());

            return toMessageResponse(assistant);
        } catch (Exception ex) {
            log.error("Chat request error", ex);
            throw new RuntimeException("Failed to generate chat response", ex);
        }
    }



    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getRole(),
                message.getContent(),
                citationMapper.fromJson(message.getCitations()),
                message.getCreatedAt());
    }
}
