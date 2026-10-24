# Manifestation Command Deck — Implementation Plan

Active, immersive identity system merging visuals, micro-video loops, present-tense scripts, self-voice + Solfeggio stems, and companion reinforcement.

## Pillars

| Pillar | Accent | Frequency | Focus |
| --- | --- | --- | --- |
| Personal | Cyan | 528 Hz | Vitality, mental sovereignty |
| Social | Amber | 639 Hz | Charisma, network, loyalty |
| Economical | Gold | 888 Hz | Capital flow, autonomy |
| Professional | Emerald | 40 Hz | Architecture, deep work, exits |

## Phases

### Phase 1 — Zero-scroll UI & media renderer
- Viewport-locked quad matrix (no vertical page scroll inside PhoneShell)
- Glassmorphic pillar tiles with neon borders + still/video backdrop
- Ambient canvas hue shifts with active pillar
- Header: Identity Code + Aura Score
- Bottom: Identity Shift control + companion bubble + dock

### Phase 2 — Dual-stem audio engine
- Voice Echo recorder (60s script per pillar) → normalize → store URI
- Solfeggio / binaural tone assets (528 / 639 / 888 / 40)
- Dual-stem mixer: user voice + ambient tone (default ~30/70)
- Tap pillar → play; Silence control stops stems

### Phase 3 — Reality Lock + Vision + companion hooks
- 60s Reality Lock: fullscreen pillar, tone + voice/TTS, companion line @ ~50s, haptic exit
- Vision Synthesizer: prompt → pin to pillar (generative API stub; crops to tile)
- Companion hooks per pillar + Aura derived from Sync Score

## File map

```
app/manifest.tsx
components/{PillarTile,RealityLock,VoiceEchoRecorder,VisionSynthesizer,BottomDock}.tsx
lib/manifestation/{types,seed,storage,audio}.ts
assets/manifestation/{stills,tones}/
```

## Acceptance
- Manifest tab fits one phone viewport without page scroll
- Four pillars play identity + frequency stem
- Long-press tile → Reality Lock; long-press Identity Shift → Voice Echo
- Vision Studio saves prompt to pillar state
- Companion line appears on enter / after play
