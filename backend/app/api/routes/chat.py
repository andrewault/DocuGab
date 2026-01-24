from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.core.database import get_db
from app.services.chat import generate_response


router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    document_id: int | None = None


@router.post("/")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Chat with your documents using RAG.
    
    Retrieves relevant chunks from uploaded documents and generates
    a response using the local LLM (Ollama).
    """
    return StreamingResponse(
        generate_response(request.query, db, request.document_id),
        media_type="text/event-stream"
    )


@router.post("/query")
async def chat_query(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Non-streaming chat endpoint.
    
    Returns the complete response after generation.
    """
    response_parts = []
    async for chunk in generate_response(request.query, db, request.document_id):
        response_parts.append(chunk)
    
    return {"response": "".join(response_parts)}
