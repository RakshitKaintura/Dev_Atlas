package devAtlas.backend.service.ai;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import devAtlas.backend.models.Repository;
import devAtlas.backend.repository.RepositoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class VisualizationService {

    private final ChatModel chatModel;
    private final CodeContextRetriever retriever;
    private final RepositoryRepository repositoryRepository;

    @Async("indexingExecutor")
    public void generateVisualizationsAsync(UUID repoId) {
        log.info("Generating visualizations for repo {} in parallel", repoId);
        
        Repository repo = repositoryRepository.findById(repoId)
                .orElseThrow(() -> new IllegalArgumentException("Repo not found"));

        try {
            updateStage(repoId, "GENERATING_VISUALIZATIONS");

            CompletableFuture<String> archFuture = CompletableFuture.supplyAsync(() -> {
                String context = retriever.retrieve(repoId, "system architecture, high level modules, entry points, structural design").contextText();
                return generateDiagram("system architecture diagram", context, 
                    "Generate a detailed Mermaid flowchart (graph TD). Structure the chart professionally by grouping related components into `subgraph` blocks (e.g., Frontend, Backend, Database, External Services). Clearly label all connection edges to explain the interaction (e.g., 'REST API call', 'Reads/Writes'). Highlight the core application flow.");
            });

            CompletableFuture<String> schemaFuture = CompletableFuture.supplyAsync(() -> {
                String context = retriever.retrieve(repoId, "database schema, entity models, tables, columns, JPA entities").contextText();
                return generateDiagram("database schema ER diagram", context, 
                    "Generate a detailed Mermaid erDiagram. Include the most critical tables and their relationships. Inside each table, list the primary keys, foreign keys, and major data columns with their approximate types. Clearly mark the relationship cardinalities (e.g., one-to-many, many-to-many).");
            });

            CompletableFuture<String> flowFuture = CompletableFuture.supplyAsync(() -> {
                String context = retriever.retrieve(repoId, "data flow, service layer, repository interactions, request lifecycle").contextText();
                return generateDiagram("data flow sequence diagram", context, 
                    "Generate a detailed Mermaid sequenceDiagram. Illustrate the step-by-step data flow of the most important core use-case in the application. Define clear participants (e.g., User, Frontend, API Controller, Service, Database) and show the request and response lifecycle, including any validations or external calls.");
            });

            CompletableFuture<String> workingFuture = CompletableFuture.supplyAsync(() -> {
                String context = retriever.retrieve(repoId, "business logic, main workflows, step by step processing, use cases").contextText();
                return generateDiagram("working flow diagram", context, 
                    "Generate a detailed Mermaid flowchart (graph TD). Map out the primary business logic workflow or user journey. Use flowchart shapes effectively (e.g., diamonds `id{{\"Decision\"}}` for conditions, rounded rectangles `id(\"Action\")` for steps). Add descriptive labels to transition arrows detailing the conditions or actions that trigger them.");
            });

            CompletableFuture<String> componentFuture = CompletableFuture.supplyAsync(() -> {
                String context = retriever.retrieve(repoId, "frontend components, UI structure, react components, package structure, modules").contextText();
                return generateDiagram("component tree diagram", context, 
                    "Generate a detailed Mermaid flowchart (graph TD). Map the hierarchical structure of the frontend components or backend modules. Group deeply nested components into logical `subgraph` blocks based on the feature or page they belong to, making the hierarchy easy to read at a glance.");
            });

            CompletableFuture<String> apiFuture = CompletableFuture.supplyAsync(() -> {
                String context = retriever.retrieve(repoId, "REST controllers, API endpoints, routes, http mapping").contextText();
                return generateDiagram("API endpoint map diagram", context, 
                    "Generate a detailed Mermaid flowchart (graph LR). Map the flow from the Client, to the specific REST API endpoints, and finally to the internal services they trigger. Group endpoints by domain or controller using `subgraph`. Label edges with the HTTP method (GET, POST, etc.) and payload summaries.");
            });

            // Wait for all diagrams to be generated simultaneously
            CompletableFuture.allOf(archFuture, schemaFuture, flowFuture, workingFuture, componentFuture, apiFuture).join();

            repo.setArchitectureDiagram(archFuture.get());
            repo.setSchemaDiagram(schemaFuture.get());
            repo.setFlowDiagram(flowFuture.get());
            repo.setWorkingFlowDiagram(workingFuture.get());
            repo.setComponentTreeDiagram(componentFuture.get());
            repo.setApiEndpointDiagram(apiFuture.get());
            repo.setCurrentStage("COMPLETE");

            repositoryRepository.save(repo);
            log.info("Visualizations generated and saved for repo {}", repoId);
        } catch (Exception e) {
            updateStage(repoId, "ERROR");
            log.error("Failed to generate visualizations for repo {}", repoId, e);
        }
    }

    private void updateStage(UUID repoId, String stage) {
        repositoryRepository.findById(repoId).ifPresent(repo -> {
            repo.setCurrentStage(stage);
            repositoryRepository.save(repo);
        });
    }

    private String generateDiagram(String description, String context, String promptText) {
        String fullPrompt = "You are an Expert Software Architect tasked with designing a highly professional " + description + ".\n\n"
                + "REQUIREMENTS:\n"
                + "- ONLY output valid Mermaid code.\n"
                + "- The chart MUST be highly professional, logically structured, and visually balanced. Avoid overlapping spaghetti lines by utilizing standard architectural patterns and hierarchical layouts.\n"
                + "- When using flowcharts (graph TD/LR), heavily utilize `subgraph` groupings to create clear domain boundaries (e.g., 'Client Layer', 'API Gateway', 'Core Services', 'Database').\n"
                + "- ALWAYS enclose all node text and labels in double quotes (e.g. `NodeID[\"Your Label Text [...]\"]`) to prevent syntax errors caused by special characters like brackets or parentheses.\n"
                + "- NEVER use internal double quotes, backslashes, or escape characters inside the label text itself. Replace any internal quotes with single quotes to prevent breaking the Mermaid parser.\n"
                + "- If generating a sequenceDiagram, DO NOT use `activate` or `deactivate`. This frequently causes 'inactive participant' parser crashes.\n"
                + "- Use highly descriptive edge labels to clarify exactly what data is flowing or what action is being taken (e.g. `-->|\"Authenticates User (JWT)\"|`).\n"
                + "- Ensure the content accurately reflects the core functionality of the provided codebase, capturing the essence of what it actually does rather than generic blocks.\n"
                + "- Do NOT use any custom colors, inline styles (e.g. `style`, `classDef`), or theming. The frontend uses a strict dark theme, and custom light colors will make the white text invisible.\n"
                + "- Do NOT output any explanations or markdown formatting outside of the Mermaid code block. ONLY output the raw Mermaid block.\n\n"
                + "CODEBASE CONTEXT:\n" + context + "\n\n"
                + "SPECIFIC INSTRUCTIONS:\n" + promptText;

        try {
            String response = ChatClient.create(chatModel)
                    .prompt()
                    .user(fullPrompt)
                    .call()
                    .content();

            return extractMermaid(response);
        } catch (Exception e) {
            log.warn("Failed to generate {} diagram", description, e);
            return null;
        }
    }

    public RetrievedContext explainNode(UUID repoId, String nodeName) {
        RetrievedContext rawContext = retriever.retrieve(repoId, nodeName);
        
        if (rawContext == null || rawContext.contextText().isBlank()) {
            return new RetrievedContext(List.of(), "No code context found for this component.");
        }

        String fullPrompt = "You are an expert software architect. Explain the purpose and functionality of the component '" + nodeName + "' based on the following codebase context.\n\n"
                + "CONTEXT:\n" + rawContext.contextText() + "\n\n"
                + "Keep your explanation concise, readable, and structured in Markdown. Explain what it is, what its responsibilities are, and how it interacts with other parts of the system based ONLY on the provided context. Do not output raw code dumps unless absolutely necessary for a brief 1-2 line example.";

        try {
            String explanation = ChatClient.create(chatModel)
                    .prompt()
                    .user(fullPrompt)
                    .call()
                    .content();
            
            return new RetrievedContext(rawContext.citations(), explanation);
        } catch (Exception e) {
            log.warn("Failed to explain node {}", nodeName, e);
            return new RetrievedContext(rawContext.citations(), "Failed to generate AI explanation. Raw context:\n\n" + rawContext.contextText());
        }
    }

    private String extractMermaid(String response) {
        if (response == null) return null;
        
        Pattern pattern = Pattern.compile("```(?:mermaid\\s*\\n?)(.*?)\\s*```", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(response);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        String trimmed = response.trim();
        if (trimmed.startsWith("graph") || trimmed.startsWith("flowchart") || trimmed.startsWith("sequenceDiagram") || trimmed.startsWith("erDiagram") || trimmed.startsWith("stateDiagram") || trimmed.startsWith("classDiagram")) {
            return trimmed;
        }
        
        return null;
    }
}
