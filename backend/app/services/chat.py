from typing import AsyncGenerator, Optional
from langchain_aws import ChatBedrock
from langchain_core.messages import HumanMessage, SystemMessage
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.services.retrieval import search_similar_chunks
from app.models.media import ProjectMedia
from app.models.link import ProjectLink
from app.models.chat_parameter import ChatParameter
import json
import re
import boto3
import time

# Initialize LLM cache
_llm_cache: dict[float, ChatBedrock] = {}

# Active ChatParameter cache
_active_param_cache: dict = {
    "param": None,
    "timestamp": 0,
    "ttl": 300,  # 5 minute TTL
}


def get_llm(temperature: float = 0.2) -> ChatBedrock:
    """Get or create the LLM instance with specified temperature."""
    global _llm_cache
    if temperature not in _llm_cache:
        client = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        _llm_cache[temperature] = ChatBedrock(
            client=client,
            model_id=settings.bedrock_llm_model,
            streaming=True,
            model_kwargs={"temperature": temperature},
        )
    return _llm_cache[temperature]


def invalidate_chat_parameter_cache() -> None:
    """Invalidate the active chat parameter cache. Call when activation changes."""
    global _active_param_cache
    _active_param_cache["param"] = None
    _active_param_cache["timestamp"] = 0


async def get_active_chat_parameter(db: AsyncSession) -> Optional[ChatParameter]:
    """Get the currently active chat parameter with caching."""
    global _active_param_cache

    now = time.time()
    # Return cached if valid
    if (
        _active_param_cache["param"]
        and (now - _active_param_cache["timestamp"]) < _active_param_cache["ttl"]
    ):
        return _active_param_cache["param"]

    # Fetch from database
    result = await db.execute(select(ChatParameter).where(ChatParameter.is_active))
    param = result.scalar_one_or_none()

    # Update cache
    _active_param_cache["param"] = param
    _active_param_cache["timestamp"] = now

    return param


SYSTEM_PROMPT = """You are a friendly and conversational assistant. 
Answer questions based ONLY on the provided context, with the following exception:
- You may respond naturally to greetings (e.g., "Hello", "Hi") and conversational openers.

For all other queries:
- If the answer is not in the context, say "I couldn't find that information in the documents."
- Always cite your sources using [Source: filename] format.

While strict about facts, engage the user warmly and be helpful.
"""


async def generate_response(
    query: str,
    db: AsyncSession,
    project_id: int | None = None,
    document_id: int | None = None,
) -> AsyncGenerator[str, None]:
    """
    Generate a streaming response with RAG context using Ollama.

    For multi-tenant security, pass project_id to scope retrieval to project documents.
    """
    # Get active chat parameter (or use defaults)
    active_param = await get_active_chat_parameter(db)
    system_prompt = active_param.system_prompt if active_param else SYSTEM_PROMPT
    temperature = active_param.temperature if active_param else 0.2

    # Built-in Responses: Check for greetings to skip retrieval and sources
    builtin_keywords = {
        "hello",
        "hi",
        "hey",
        "greetings",
        "good morning",
        "good afternoon",
        "good evening",
        "how are you",
        "how are you?",
        "how are you doing",
    }
    cleaned_query = query.strip().lower().rstrip("?!.,")

    if cleaned_query in builtin_keywords:
        # Direct chat without RAG (Built-in Response)
        messages = [
            SystemMessage(
                content="You are a friendly assistant. Respond naturally to the user's greeting."
            ),
            HumanMessage(content=query),
        ]
        llm = get_llm(temperature)
        async for chunk in llm.astream(messages):
            if chunk.content:
                yield str(chunk.content)
        return

    # Retrieve relevant chunks (filtered by project_id for isolation)
    chunks = await search_similar_chunks(
        query, db, project_id=project_id, document_id=document_id, limit=5
    )

    if not chunks:
        yield "I don't have any documents to search. Please upload some documents first."
        return

    # Fetch Ancillary Resources if project_id is present
    media_items = []
    link_items = []
    if project_id:
        result_media = await db.execute(
            select(ProjectMedia).where(ProjectMedia.project_id == project_id)
        )
        media_items = result_media.scalars().all()

        result_links = await db.execute(
            select(ProjectLink).where(ProjectLink.project_id == project_id)
        )
        link_items = result_links.scalars().all()

    # Build context from retrieved chunks
    context_parts = []
    for c in chunks:
        source_ref = c["filename"]
        if not c["filename"].strip().lower().endswith(".md"):
            source_ref += f", Page {c['page']}"
        context_parts.append(f"[{source_ref}]:\n{c['content']}")

    context = "\n\n---\n\n".join(context_parts)

    # Build messages using active system prompt
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {query}"),
    ]

    # Stream response from LLM with active temperature
    llm = get_llm(temperature)
    full_response_text = ""
    async for chunk in llm.astream(messages):
        if chunk.content:
            content = str(chunk.content)
            full_response_text += content
            yield content

    # Append sources with UUIDs for linking
    yield "\n\n**Sources:**\n"
    seen_docs = set()
    for c in chunks:
        doc_key = c["document_uuid"]
        if doc_key not in seen_docs:
            seen_docs.add(doc_key)
            filename_clean = c["filename"].strip().lower()
            if filename_clean.endswith(".md"):
                yield f"- [{c['filename']}](/documents/{c['document_uuid']})\n"
            else:
                yield f"- [{c['filename']}](/documents/{c['document_uuid']}), Page {c['page']}\n"

    # Ancillary Matching Logic
    found_media = []
    found_links = []

    # Simple word boundary matching
    # We combine the query and the response to find keywords?
    # The plan says "If the Chat response has a key word".
    text_to_scan = full_response_text.lower()

    for m in media_items:
        # Check if any keyword matches
        for kw in m.keywords:
            # Escape keyword for regex and look for word boundaries
            pattern = r"\b" + re.escape(kw.lower()) + r"\b"
            if re.search(pattern, text_to_scan):
                found_media.append(
                    {"type": m.type, "url": m.url, "description": m.description}
                )
                break  # Only add media item once even if multiple keywords match

    for link_item in link_items:
        for kw in link_item.keywords:
            pattern = r"\b" + re.escape(kw.lower()) + r"\b"
            if re.search(pattern, text_to_scan):
                found_links.append({"name": link_item.name, "url": link_item.url})
                break

    if found_media or found_links:
        ancillary_payload = {"media": found_media, "links": found_links}
        # Append as a special section that frontend can parse
        yield f"\n\n**Ancillary:**\n{json.dumps(ancillary_payload)}"
