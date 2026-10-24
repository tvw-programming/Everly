# Manifestation Command Deck — Implementation Plan

Active, immersive identity system merging visuals, micro-video loops, present-tense scripts, self-voice + Solfeggio stems, and companion reinforcement. Queued alongside Companion Phases 2–4.

## Pillars

| Pillar | Accent | Frequency | Focus |
| --- | --- | --- | --- |
| Personal | Cyan `#22D3EE` | 528 Hz | Vitality, mental sovereignty |
| Social | Amber `#F59E0B` | 639 Hz | Charisma, network, loyalty |
| Economical | Gold `#EAB308` | 888 Hz | Capital flow, autonomy |
| Professional | Emerald `#10B981` | 40 Hz | Architecture, deep work, exits |

## Layout (viewport-locked)

```
Header: Identity Code + Aura Score
Quad matrix: Personal | Social / Economical | Professional
Identity Shift hold bar + dual-stem mix
AI companion inbound bubble
Dock: Home · + · Manifest
```

## Media fusion

| Asset | Behavior |
| --- | --- |
| Cinematic stills / micro-video | Loop behind glassmorphic pillar cards |
| Present-tense scripts | High-contrast identity + micro-strip |
| Voice Echo | Record per pillar → loop under frequency stem |
| Dual-stem mixer | Default 30% voice / 70% ambient |
| Companion hooks | Warm reinforcement after pillar play / Reality Lock |

## Engine mechanics

1. **Voice Echo** — record pillar script; playback with Solfeggio/binaural stem
2. **60s Reality Lock** — fullscreen pillar, voice+tone, companion line @ 50s, haptic → Home
3. **Vision Synthesizer** — prompt pin per pillar (generative API via `EXPO_PUBLIC_VISION_API_URL`)

## Roadmap

### Phase 1 — Zero-scroll UI & media renderer ✅
- Quad viewport layout in `app/manifestation.tsx`
- Glassmorphic `PillarCard` with still URI + neon border
- Ambient hue from active pillar
- Hardware-friendly video hook (`videoUri` ready)

### Phase 2 — Dual-stem audio engine ✅
- Bundled WAV carriers (40 / 528 / 639 / 888) + WebAudio oscillator on web
- Voice Echo recorder (device) + TTS fallback
- Voice mix chips (20 / 30 / 50%)

### Phase 3 — Reality Lock + Vision + companion ✅
- `RealityLock` 60s ritual → return to task deck
- Vision prompt studio (stub for generative API)
- Companion hooks + Aura score synced from Sync Score

### Phase 4 — Deep integrations (queued)
- Whisper STT for live Voice Echo
- On-device / cloud vision + micro-video generation
- Calendar-linked pillar auto-select + Neural TTS companion

## Commit message

```
feat(manifestation): specify quad-pillar design, self-voice transmutation engine, and cinematic vision loop
```
