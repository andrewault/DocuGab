"""Speech services for STT and TTS using Google Cloud APIs."""

import base64
from typing import Optional

from app.core.config import settings


async def transcribe_audio(
    audio_bytes: bytes, language: Optional[str] = None, mime_type: str = "audio/webm"
) -> str:
    """
    Transcribe audio to text using Google Cloud Speech-to-Text.

    Args:
        audio_bytes: Raw audio data (webm, wav, etc.)
        language: Optional language code (default: en-US)
        mime_type: MIME type of the audio file

    Returns:
        Transcribed text
    """
    from google.cloud import speech

    client = speech.SpeechClient()
    audio = speech.RecognitionAudio(content=audio_bytes)

    # Determine encoding based on mime type
    encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS  # Default
    if "ogg" in mime_type:
        encoding = speech.RecognitionConfig.AudioEncoding.OGG_OPUS
    elif "mp3" in mime_type or "mpeg" in mime_type:
        encoding = speech.RecognitionConfig.AudioEncoding.MP3
    elif "wav" in mime_type or "x-wav" in mime_type:
        encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
    
    # Note: MP4/AAC is not directly supported by standard RecognitionConfig without ffmpeg conversion
    # unless using V2 API. For now, we default to WEBM_OPUS which covers most modern browsers.

    config = speech.RecognitionConfig(
        encoding=encoding,
        # sample_rate_hertz is optional for WEBM_OPUS/OGG_OPUS and retrieved from header
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
    voice_name = voice or getattr(settings, "tts_voice", "en-US-Neural2-F")

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
        input=synthesis_input, voice=voice_params, audio_config=audio_config
    )

    return response.audio_content


async def synthesize_for_avatar(text: str, voice: Optional[str] = None) -> dict:
    """
    Convert text to speech and return in TalkingHead compatible format.

    Returns JSON with:
    - audioContent: base64 encoded MP3 audio
    - timepoints: estimated word timing markers

    Args:
        text: Text to convert to speech
        voice: Voice name (optional)

    Returns:
        Dict with audioContent and timepoints for TalkingHead
    """
    from google.cloud import texttospeech

    client = texttospeech.TextToSpeechClient()

    # Use configured voice or default
    voice_name = voice or getattr(settings, "tts_voice", "en-US-Neural2-F")

    words = text.split()

    # Create SSML with word marks for timing
    # Use plain text for synthesis (Studio voices don't support SSML marks)
    # We estimate timepoints manually below anyway
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
        audio_config=audio_config,
    )

    # Calculate estimated timepoints (Google doesn't always return them)
    # Estimate ~150ms per word on average
    timepoints = []
    estimated_time = 0.0
    for i, word in enumerate(words):
        timepoints.append({"markName": str(i), "timeSeconds": estimated_time})
        # Estimate duration based on word length
        word_duration = max(0.15, len(word) * 0.06)
        estimated_time += word_duration

    return {
        "audioContent": base64.b64encode(response.audio_content).decode("utf-8"),
        "timepoints": timepoints,
    }
