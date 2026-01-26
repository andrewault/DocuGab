"""Speech services for STT and TTS using Google Cloud APIs."""
from typing import Optional

from app.core.config import settings


async def transcribe_audio(audio_bytes: bytes, language: Optional[str] = None) -> str:
    """
    Transcribe audio to text using Google Cloud Speech-to-Text.
    
    Args:
        audio_bytes: Raw audio data (webm, wav, etc.)
        language: Optional language code (default: en-US)
    
    Returns:
        Transcribed text
    """
    from google.cloud import speech
    
    client = speech.SpeechClient()
    audio = speech.RecognitionAudio(content=audio_bytes)
    
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        sample_rate_hertz=48000,
        language_code=language or "en-US",
        enable_automatic_punctuation=True,
    )
    
    response = client.recognize(config=config, audio=audio)
    
    # Combine all transcription results
    transcripts = []
    for result in response.results:
        if result.alternatives:
            transcripts.append(result.alternatives[0].transcript)
    
    return " ".join(transcripts)


async def synthesize_speech(text: str, voice: Optional[str] = None) -> bytes:
    """
    Convert text to speech using Google Cloud Text-to-Speech.
    
    Args:
        text: Text to convert to speech
        voice: Voice name (default: from settings or en-US-Neural2-F)
    
    Returns:
        Audio bytes (MP3 format)
    """
    from google.cloud import texttospeech
    
    client = texttospeech.TextToSpeechClient()
    
    # Use configured voice or default
    voice_name = voice or getattr(settings, 'tts_voice', 'en-US-Neural2-F')
    
    synthesis_input = texttospeech.SynthesisInput(text=text)
    
    voice_params = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name=voice_name,
    )
    
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        speaking_rate=1.0,
    )
    
    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice_params,
        audio_config=audio_config
    )
    
    return response.audio_content
