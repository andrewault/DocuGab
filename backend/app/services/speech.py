"""Speech services for STT (Google) and TTS (AWS Polly)."""

import base64
import hashlib
import boto3
from typing import Optional

from app.core.config import settings
from app.services.storage import get_s3_client


def get_polly_client():
    """Get AWS Polly client with settings."""
    kwargs = {"region_name": settings.aws_region}
    if settings.aws_access_key_id and settings.aws_secret_access_key:
        kwargs["aws_access_key_id"] = settings.aws_access_key_id
        kwargs["aws_secret_access_key"] = settings.aws_secret_access_key
    return boto3.client("polly", **kwargs)


async def synthesize_speech(text: str, voice: Optional[str] = None) -> bytes:
    """
    Convert text to speech using AWS Polly (with S3 Caching).

    Args:
        text: Text to convert to speech
        voice: Voice name (default: from settings or Joanna)

    Returns:
        Audio bytes (MP3 format)
    """
    try:
        polly = get_polly_client()
        s3 = get_s3_client()

        voice_id = voice or getattr(settings, "tts_voice_id", "Joanna")
        engine = getattr(settings, "tts_engine", "neural")

        # 1. Compute Cache Key
        unique_str = f"{text}-{voice_id}-{engine}"
        # bearer:disable python_lang_weak_hash_md5
        cache_hash = hashlib.md5(
            unique_str.encode("utf-8"), usedforsecurity=False
        ).hexdigest()
        cache_key = f"audio_cache/{cache_hash}.mp3"
        bucket = getattr(settings, "s3_tts_bucket", "dokutok-text-to-speech")

        # 2. Check S3 Cache
        if settings.storage_backend == "s3":
            try:
                response = s3.get_object(Bucket=bucket, Key=cache_key)
                print(f"S3 Cache Hit: {cache_key}")
                audio_stream = response["Body"].read()
                return audio_stream
            except Exception:
                # Cache miss or S3 error -> proceed to Polly
                pass

        # 3. Call Polly
        print(f"Calling AWS Polly: {voice_id} ({engine})")
        try:
            response = polly.synthesize_speech(
                Text=text, OutputFormat="mp3", VoiceId=voice_id, Engine=engine
            )
        except Exception as e:
            print(f"Polly Synthesis Failed: {e}")

            # Fallback for Invalid VoiceId
            if (
                "ValidationException" in str(e)
                and ("voiceid" in str(e).lower())
                and voice_id != "Joanna"
            ):
                print(f"Invalid VoiceId '{voice_id}'. Retrying with fallback 'Joanna'.")
                return await synthesize_speech(text, "Joanna")

            # Fallback to standard engine if neural fails
            if "Engine not supported" in str(e):
                print("Fallback to 'standard' engine.")
                response = polly.synthesize_speech(
                    Text=text, OutputFormat="mp3", VoiceId=voice_id, Engine="standard"
                )
            else:
                raise e

        if "AudioStream" not in response:
            raise RuntimeError("AWS Polly synthesis failed: No AudioStream returned")

        audio_bytes = response["AudioStream"].read()

        # 4. Save to S3 Cache
        if settings.storage_backend == "s3":
            try:
                s3.put_object(
                    Bucket=bucket,
                    Key=cache_key,
                    Body=audio_bytes,
                    ContentType="audio/mpeg",
                )
                print("Cached audio to S3.")
            except Exception as e:
                print(f"Failed to write to S3 cache: {e}")

        return audio_bytes

    except Exception as e:
        print(f"Critical Error in synthesize_speech: {e}")
        raise e


async def synthesize_for_avatar(text: str, voice: Optional[str] = None) -> dict:
    """
    Convert text to speech and return in TalkingHead compatible format.
    Uses AWS Polly for audio and manual estimation for timepoints.

    Returns JSON with:
    - audioContent: base64 encoded MP3 audio
    - timepoints: estimated word timing markers

    Args:
        text: Text to convert to speech
        voice: Voice name (optional)

    Returns:
        Dict with audioContent and timepoints for TalkingHead
    """
    # Use the main synthesis function to get audio
    audio_bytes = await synthesize_speech(text, voice)

    # Calculate estimated timepoints (Polly marks are complex, estimating for compatibility)
    # Estimate ~150ms per word on average (same logic as Google fallback)
    words = text.split()
    timepoints = []
    estimated_time = 0.0
    for i, word in enumerate(words):
        timepoints.append({"markName": str(i), "timeSeconds": estimated_time})
        # Estimate duration based on word length
        word_duration = max(0.15, len(word) * 0.06)
        estimated_time += word_duration

    return {
        "audioContent": base64.b64encode(audio_bytes).decode("utf-8"),
        "timepoints": timepoints,
    }
