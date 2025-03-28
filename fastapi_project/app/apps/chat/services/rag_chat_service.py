from typing import AsyncGenerator, List, Optional, Dict, Any
import logging
from app.apps.rag.services.embedding_service import EmbeddingService
from app.apps.rag.utils.vector_store import CloudVectorStore
from app.apps.chat.services.gemini_service import GeminiChatService

logger = logging.getLogger(__name__)


async def get_rag_streaming_response(
    query: str,
    embedding_service: EmbeddingService,
    vector_store: CloudVectorStore,
    chat_service: GeminiChatService,
    history: Optional[List[Dict[str, Any]]] = None,
    top_k: int = 3,
) -> AsyncGenerator[str, None]:
    """Generate RAG-enhanced streaming response for customer support."""
    try:
        # 1. Retrieve relevant documents
        query_embedding = embedding_service.get_embeddings(query)
        search_results = vector_store.search(query_embedding, top_k)

        # 2. Format retrieved documents
        context = format_context(search_results)

        # 3. Create RAG-enhanced prompt
        rag_prompt = create_rag_prompt(query, context)

        # 4. Get streaming response from chat service
        async for chunk in chat_service.get_streaming_response(rag_prompt, history):
            yield chunk

    except Exception as e:
        logger.error(f"RAG chat error: {str(e)}")
        yield f"I encountered an error while processing your request: {str(e)}"


def format_context(search_results: List[Dict[str, Any]]) -> str:
    """Format search results into context string."""
    context_parts = []

    for i, result in enumerate(search_results, 1):
        document = result["document"]
        score = result["score"]
        text = document.get("text", "")
        metadata = document.get("metadata", {})

        source = metadata.get("source", "Unknown source")

        context_parts.append(
            f"[Document {i} (relevance: {score:.2f}) from {source}]:\n{text}\n"
        )

    return "\n".join(context_parts)


def create_rag_prompt(query: str, context: str) -> str:
    """Create a RAG-enhanced prompt for customer support."""
    return f"""You are a helpful customer support representative named Alex working for our company. 
Act naturally as if you are a real person having a conversation with the customer.

CONTEXT INFORMATION:
{context}

CUSTOMER QUESTION:
{query}

Important instructions:
1. Only use the context information if it directly relates to the customer's question
2. Completely ignore any context that isn't relevant to the current question
3. Respond in a friendly, conversational tone while remaining professional
4. Use natural language with occasional verbal fillers (like "I see", "Let me check that for you")
5. If you don't have enough information to fully answer, be honest about limitations
6. Keep responses concise and focused on solving the customer's problem
7. Don't mention that you're an AI - act as if you're a real support agent

Respond directly to the customer as Alex from customer support.
"""
