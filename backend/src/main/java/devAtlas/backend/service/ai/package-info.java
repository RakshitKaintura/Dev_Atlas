/**
 * AI and RAG (Retrieval-Augmented Generation) building blocks.
 *
 * <p>DevAtlas chat works in three stages:
 * <ol>
 *   <li><b>Index</b> — repository files are split into chunks and stored as vectors (see indexing package)</li>
 *   <li><b>Retrieve</b> — {@link devAtlas.backend.service.ai.CodeContextRetriever} finds chunks similar to the user's question</li>
 *   <li><b>Generate</b> — {@link devAtlas.backend.service.ai.ChatStreamHandler} sends those chunks + the question to Google GenAI and streams the answer</li>
 * </ol>
 */
package devAtlas.backend.service.ai;
