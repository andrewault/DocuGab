"""Speech API routes for transcription (STT) and synthesis (TTS)."""
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from app.services.speech import transcribe_audio, synthesize_speech


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
