# AWS Polly Text-to-Speech Migration Plan

## Objective
Migrate the application's Text-to-Speech (TTS) service from **Google Cloud TTS** to **AWS Polly**.
This consolidates our infrastructure on AWS (alongside Bedrock and S3) and simplifies credential management.

## Current State
*   **Service**: Google Cloud TTS
*   **Config**: `tts_voice` defaults to `en-US-Neural2-F`.
*   **Implementation**: `app.services.speech.py` uses Google libraries (presumably).

## Implementation Plan

### 1. Configuration (`app/core/config.py`)
*   **Remove**: Google-specific defaults.
*   **Add**: AWS Polly settings.
    *   `TTS_ENGINE`: `neural` (Mandatory for high quality/naturalness).
    *   `TTS_VOICE_ID`: `Joanna` (Default).
    *   `AWS_REGION`: `us-west-2`.
    *   `S3_TTS_BUCKET`: `dokutok-text-to-speech` (Dedicated bucket).

### 2. Service Refactor (`app/services/speech.py`)
*   **Library**: Switch to `boto3`.
*   **Method**: `polly.synthesize_speech`.
*   **Caching Strategy (Mandatory)**:
    *   Compute Hash (MD5/SHA256) of input text + voice ID.
    *   **Check S3 Cache**: `s3://dokutok-text-to-speech/audio_cache/{hash}.mp3`.
        *   If Hit: Download/Stream from S3 (skips Polly cost).
        *   If Miss: Call Polly -> Upload to S3 -> Return audio.
*   **Output**: Stream audio bytes (MP3) to maintain frontend compatibility.

### 3. Frontend Compatibility
*   **Minimal Changes**: The backend will return a stream of bytes (MP3), exactly as the frontend currently expects.
*   **No Code Changes**: `app/services/speech.py` will internalize the S3 caching logic, so the API contract remains `POST /speech/synthesize -> Audio Stream`.

### 4. IAM Permissions
The backend IAM user/role need permissions for Polly AND S3 caching.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "polly:SynthesizeSpeech",
                "polly:DescribeVoices"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": ["s3:PutObject", "s3:GetObject"],
            "Resource": "arn:aws:s3:::dokutok-text-to-speech/*"
        }
    ]
}
```

## Next Steps
1.  Verify `boto3` is available (it is).
2.  Update IAM Policy for the backend user.
3.  Refactor `speech.py`.
4.  Update specific environment variables.
