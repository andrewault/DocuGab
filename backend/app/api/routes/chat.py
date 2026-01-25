import uuid as uuid_lib
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from pydantic import BaseModel
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user_optional, get_current_user
from app.services.chat import generate_response
from app.models.chat_message import ChatMessage
from app.models.user import User


router = APIRouter()


class ChatRequest(BaseModel):
    query: str
    document_id: int | None = None
    session_id: str | None = None  # Optional session grouping


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    session_id: str
    created_at: str
    
    class Config:
        from_attributes = True


class SaveMessageRequest(BaseModel):
    role: str
    content: str
    session_id: str
    document_filter_id: int | None = None


@router.get("/history")
async def get_chat_history(
    session_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get chat history for the current user."""
    query = select(ChatMessage).where(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.asc())
    
    if session_id:
        query = query.where(ChatMessage.session_id == UUID(session_id))
    
    result = await db.execute(query)
    messages = result.scalars().all()
    
    return {
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "session_id": str(m.session_id),
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]
    }


@router.post("/history")
async def save_chat_message(
    request: SaveMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save a chat message."""
    message = ChatMessage(
        user_id=current_user.id,
        session_id=UUID(request.session_id),
        role=request.role,
        content=request.content,
        document_filter_id=request.document_filter_id,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    return {
        "id": message.id,
        "role": message.role,
        "content": message.content,
        "session_id": str(message.session_id),
        "created_at": message.created_at.isoformat(),
    }


@router.delete("/history")
async def clear_chat_history(
    session_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Clear chat history for the current user."""
    query = delete(ChatMessage).where(
        ChatMessage.user_id == current_user.id
    )
    
    if session_id:
        query = query.where(ChatMessage.session_id == UUID(session_id))
    
    await db.execute(query)
    await db.commit()
    
    return {"message": "Chat history cleared"}


@router.post("/")
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional)
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
