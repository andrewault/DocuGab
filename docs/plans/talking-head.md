# Talking Head Avatar Implementation Plan

Animated 3D avatar that speaks responses using the TalkingHead library from DialogLab.

**Prerequisite**: Complete [bidirectional-speech-text.md](./bidirectional-speech-text.md) first.

## Overview

Add an animated 3D avatar that lip-syncs to TTS responses, creating a more engaging conversational experience.

## Technology

Based on [DialogLab](https://github.com/ecruhue/DialogLab):

| Component | Technology | License |
|-----------|------------|---------|
| 3D Avatar | Ready Player Me (.glb) | Custom |
| Animation | TalkingHead library | MIT |
| Rendering | Three.js | MIT |
| TTS | Google Cloud TTS | (from speech-text plan) |

## Architecture

```
User asks question
        ↓
RAG generates text response
        ↓
TTS synthesizes audio (Google Cloud)
        ↓
TalkingHead animates avatar
lip-syncing to audio
        ↓
User sees/hears animated response
```

---

## UI Layout

### Controls
An **"Animation"** checkbox will be added to the left sidebar column, below the "Filter by document" dropdown.

### Layout Behavior

**Animation OFF** (default):
```
┌─────────────────────────────────────────────────┐
│ Sidebar    │              Chat                  │
│            │                                    │
│ [Filter]   │     Messages...                    │
│ [ ] Anim   │                                    │
│            │     [Input box]                    │
└─────────────────────────────────────────────────┘
```

**Animation ON**:
```
┌─────────────────────────────────────────────────┐
│ Sidebar │   Avatar Panel   │      Chat         │
│         │                  │                   │
│ [Filter]│   ┌──────────┐   │   Messages...     │
│ [✓] Anim│   │  Avatar  │   │                   │
│         │   └──────────┘   │   [Input box]     │
└─────────────────────────────────────────────────┘
```

- Chat column width reduces by ~50% when animation is enabled
- Avatar panel appears to the LEFT of the chat column
- Avatar animates and lip-syncs during TTS playback

---

## Implementation

### Phase 1: Add TalkingHead Library

- [ ] Copy `talkinghead.mjs` from DialogLab to `frontend/public/libs/`
- [ ] Add Three.js dependency: `npm install three`
- [ ] Add a default avatar .glb file to `frontend/public/assets/`

### Phase 2: Create Avatar Component

- [ ] Create `TalkingHeadAvatar.tsx` component
- [ ] Initialize Three.js scene and renderer
- [ ] Load Ready Player Me avatar model
- [ ] Integrate TalkingHead controller

### Phase 3: Update Chat Layout

- [ ] Add "Animation" checkbox to left sidebar (below filter dropdown)
- [ ] Store animation preference in localStorage
- [ ] Implement responsive grid layout:
  - Animation OFF: Sidebar | Chat (full width)
  - Animation ON: Sidebar | Avatar Panel | Chat (half width)
- [ ] Pass TTS audio to TalkingHead for lip-sync

### Phase 4: Polish

- [ ] Avatar selection (multiple characters)
- [ ] Responsive sizing for mobile (hide avatar or stack vertically)
- [ ] Loading states while avatar loads
- [ ] Performance optimization

---

## Dependencies

### Frontend
```json
{
  "three": "^0.160.0"
}
```

### Files to Add
```
frontend/
├── public/
│   ├── libs/
│   │   └── talkinghead.mjs    # From DialogLab
│   └── assets/
│       └── avatar.glb         # Ready Player Me avatar
└── src/
    └── components/
        └── TalkingHeadAvatar.tsx
```

---

## Configuration

```env
# .env additions
AVATAR_ENABLED=true
AVATAR_MODEL=/assets/avatar.glb
```

---

## Notes

- Avatar .glb files from Ready Player Me require compliance with their Terms of Use
- TalkingHead requires audio data for lip-sync timing
- Consider mobile performance when enabling avatar
- Avatar preference saved in localStorage for persistence
