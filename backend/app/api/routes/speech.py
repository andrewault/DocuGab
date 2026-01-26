"""Speech API routes for transcription (STT) and synthesis (TTS)."""
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
from typing import Optional, Any

from app.services.speech import transcribe_audio, synthesize_speech, synthesize_for_avatar


router = APIRouter()


class TranscribeResponse(BaseModel):
    text: str


class SynthesizeRequest(BaseModel):
    text: str
    voice: str | None = None


@router.post("/transcribe", response_model=TranscribeResponse)
async def transcribe(
    audio: UploadFile = File(..., description="Audio file to transcribe")
):
    """
    Transcribe audio to text using Google Cloud Speech-to-Text.
    
    Accepts audio files in various formats (wav, mp3, webm, etc.)
    Returns the transcribed text.
    """
    # Validate file type
    content_type = audio.content_type or ""
    if content_type and not any(t in content_type for t in ["audio", "video/webm"]):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {content_type}. Expected audio file."
        )
    
    try:
        audio_bytes = await audio.read()
        text = await transcribe_audio(audio_bytes)
        return TranscribeResponse(text=text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.post("/synthesize")
async def synthesize(request: SynthesizeRequest):
    """
    Convert text to speech using Google Cloud Text-to-Speech.
    
    Returns audio in MP3 format.
    """
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # Limit text length to prevent abuse
    if len(request.text) > 4096:
        raise HTTPException(
            status_code=400,
            detail="Text too long. Maximum 4096 characters."
        )
    
    try:
        audio_bytes = await synthesize_speech(request.text, request.voice)
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": 'inline; filename="speech.mp3"',
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")


@router.post("/synthesize-avatar")
async def synthesize_avatar(request: Request):
    """
    Convert text to speech for TalkingHead avatar lip-sync.
    
    Accepts Google Cloud TTS-compatible format:
    - input.ssml or input.text
    - voice.languageCode, voice.name
    - audioConfig
    
    Returns JSON with:
    - audioContent: base64 encoded MP3
    - timepoints: word timing markers for lip-sync
    """
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON body")
    
    # Extract text from Google TTS format
    input_data = body.get("input", {})
    ssml = input_data.get("ssml", "")
    text = input_data.get("text", "")
    
    # Extract plain text from SSML by removing tags
    if ssml:
        import re
        # Remove all XML/SSML tags
        text = re.sub(r'<[^>]+>', ' ', ssml)
        text = re.sub(r'\s+', ' ', text).strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    # Limit text length to prevent abuse
    if len(text) > 4096:
        raise HTTPException(
            status_code=400,
            detail="Text too long. Maximum 4096 characters."
        )
    
    # Get voice from request
    voice_data = body.get("voice", {})
    voice = voice_data.get("name")
    
    try:
        result = await synthesize_for_avatar(text, voice)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")
