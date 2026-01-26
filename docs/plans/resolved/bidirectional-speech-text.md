# Bidirectional Speech-Text Implementation Plan

Voice input (STT) and audio output (TTS) for the chat interface using Google Cloud APIs.

## Overview

Enable users to speak questions and hear responses, creating a hands-free document Q&A experience.

---

## Technology: Google Cloud APIs

Both STT and TTS will use Google Cloud APIs for consistent quality and simplified integration.

| Service | API | Pricing |
|---------|-----|---------|
| **Speech-to-Text** | Google Cloud Speech-to-Text | $0.006/15 seconds |
| **Text-to-Speech** | Google Cloud Text-to-Speech | $4/1M chars (Standard), $16/1M (WaveNet) |

### Why Google Cloud?
- Single credential setup (one API key/service account)
- High accuracy for both STT and TTS
- WaveNet voices for natural-sounding speech
- Good language support
- Streaming support for real-time transcription

---

## Implementation

### Backend

#### Dependencies
```toml
# pyproject.toml additions
google-cloud-speech = "^2.0"
google-cloud-texttospeech = "^2.0"
```

#### New Files

##### [NEW] backend/app/services/speech.py
```python
# Speech-to-Text using Google Cloud
async def transcribe_audio(audio_bytes: bytes) -> str:
    from google.cloud import speech
    client = speech.SpeechClient()
    audio = speech.RecognitionAudio(content=audio_bytes)
    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
        language_code="en-US",
    )
    response = client.recognize(config=config, audio=audio)
    return " ".join(r.alternatives[0].transcript for r in response.results)

# Text-to-Speech using Google Cloud
async def synthesize_speech(text: str, voice: str = "en-US-Neural2-F") -> bytes:
    from google.cloud import texttospeech
    client = texttospeech.TextToSpeechClient()
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice_params = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name=voice,
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )
    response = client.synthesize_speech(
        input=synthesis_input, voice=voice_params, audio_config=audio_config
    )
    return response.audio_content
```

##### [NEW] backend/app/api/routes/speech.py
- `POST /api/speech/transcribe` - Accepts audio, returns text
- `POST /api/speech/synthesize` - Accepts text, returns audio

---

### Frontend

#### Chat.tsx Updates
- Add microphone button in chat input area
- Record audio using MediaRecorder API
- Send to `/api/speech/transcribe`
- Populate input with transcribed text
- Add speaker button on assistant messages
- Fetch audio from `/api/speech/synthesize`
- Play using Audio API

---

## Configuration

```env
# .env additions
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
# OR set via environment variable pointing to JSON key file

# Optional voice selection
TTS_VOICE=en-US-Neural2-F
```

### Google Cloud Setup
1. Create a Google Cloud project
2. Enable Speech-to-Text and Text-to-Speech APIs
3. Create a service account with roles:
   - `roles/speech.client`
   - `roles/texttospeech.client`
4. Download JSON key file
5. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path

---

## Implementation Phases

### Phase 1: Setup & Backend
- [ ] Add google-cloud-speech and google-cloud-texttospeech dependencies
- [ ] Create speech service with transcribe and synthesize functions
- [ ] Add /api/speech/transcribe endpoint
- [ ] Add /api/speech/synthesize endpoint
- [ ] Test endpoints with curl

### Phase 2: Frontend - Speech-to-Text
- [ ] Add microphone button to chat input
- [ ] Implement audio recording with MediaRecorder
- [ ] Wire recording → transcription → input

### Phase 3: Frontend - Text-to-Speech
- [ ] Add speaker button to assistant messages
- [ ] Implement audio playback

### Phase 4: Polish
- [ ] Loading states for recording/transcription
- [ ] Error handling for API failures
- [ ] Voice selection dropdown (optional)

---

## Estimated Costs

For typical usage (assume 100 queries/day, 10 seconds audio each):
- **STT**: 100 × 10s × $0.006/15s ≈ $0.04/day
- **TTS**: 100 × 500 chars × $4/1M ≈ $0.20/day (Standard) or $0.80/day (WaveNet)

**Monthly estimate**: ~$7-25/month for moderate usage
