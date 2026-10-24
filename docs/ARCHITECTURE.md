# Architecture

## Stack

| Layer | Choice |
| --- | --- |
| App shell | Expo SDK ~58 + Expo Router (file-based routes) |
| UI | React Native 0.88 / React 19, `react-native-web` for browser preview |
| Persistence | `@react-native-async-storage/async-storage` (+ `localStorage` / in-memory fallbacks on web) |
| Audio | `expo-av` (playback + Voice Echo record), `expo-speech` (TTS fallback / companion lines) |
| Haptics / push | `expo-haptics`, `expo-notifications` (device builds) |
| Voice router | FastAPI + Pydantic (`backend/`), heuristic parser (no LLM required for v1) |
| Language | TypeScript (strict app), Python 3 for API |

Default ports:

- Expo web / Metro: **19006**
- Voice API: **18765**

## High-level topology

```
┌─────────────────────────────────────────────────────────────┐
│                     Expo Client (RN / Web)                   │
│  app/index ──► Reminder board + Companion engine             │
│  app/manifestation ──► Quad-pillar Manifestation Deck        │
│  app/add-reminder ──► Manual create form                     │
│                                                              │
│  lib/storage · companion · manifestation · theme · parser    │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP (optional)
                            ▼
              ┌───────────────────────────┐
              │  FastAPI Voice Router     │
              │  POST /v1/voice/parse     │
              │  GET  /health             │
              └───────────────────────────┘
```

If the API is unreachable, `lib/api.ts` falls back to `lib/parser.ts` (on-device heuristic). The UI never hard-depends on the backend.

## Route map

| Route file | Path | Role |
| --- | --- | --- |
| `app/_layout.tsx` | — | Fonts, splash, audio mode, notification listeners, Stack |
| `app/index.tsx` | `/` | Zero-scroll Home: quadrants, companion, mic FAB, dock |
| `app/add-reminder.tsx` | `/add-reminder` | Manual reminder create (modal on native) |
| `app/ideas.tsx` | `/ideas` | Voice-first Ideas vault |
| `app/manifestation.tsx` | `/manifestation` | Manifestation Command Deck |
| `app/+html.tsx` | web only | HTML shell / CSS reset for web |
| `app/+not-found.tsx` | * | 404 |

Navigation chrome: Home / `+` / Manifest (inline dock on Home & Manifest; shared `BottomDock` helper also available).

## Module map

```
app/                         Expo Router screens
components/                  Presentational + interactive UI
  AmbientAvatar.tsx          Companion presence (idle/listen/speak/react)
  VoiceCapture.tsx           Second Brain sheet (parse → confirm)
  CategoryQuadrant.tsx       Per-bucket zero-scroll panel
  HypeInterstitial.tsx       Pre-event focus modal
  DecompressionRoom.tsx      Late-night vent → tasks
  SyncScoreBadge.tsx         Co-habit taps + tier
  WarmInboundBubble.tsx      Companion TTS bubble
  ThemePicker.tsx            Light / Dark / 3D Glass selector
  ThemedCanvas.tsx           Gradient / orb canvas for themes
  manifestation/             PillarCard, RealityLock, VoiceEchoSheet
  ideas/                     IdeaCard, filters, mic FAB, detail, capture
constants/Colors.ts          Legacy static palette + category accents
lib/
  types.ts                   ReminderTask domain model
  storage.ts                 Reminder CRUD (AsyncStorage)
  schedule.ts                Today filters, priority sort, ids
  parser.ts                  Offline multi-intent router
  api.ts                     API client + fallback
  notifications.ts           Schedule / cancel local notifications
  audio.ts / sounds.ts       Reminder MP3 playback helpers
  companion/                 Mood, rituals, hype, memories, sync
  manifestation/             Deck state, seeds, dual-stem audio
  ideas/                     Idea vault types, organize, storage, seeds
  theme/                     Theme tokens, persistence, context
backend/app/                 FastAPI voice parse service
assets/sounds/               Demo MP3s
assets/manifestation/        Still placeholders + Solfeggio WAV stems
plans/                       Product/implementation roadmaps
docs/                        This documentation set
```

## Design constraints (non-negotiable for this slice)

1. **Zero-scroll Home & Manifest** — content fits one smartphone viewport (`PhoneShell` frames ~390×780 on large web).
2. **Offline-first reminders** — all task state is local; API is enrichment only for voice parse.
3. **Fail-open audio / haptics** — missing mic permission or web limitations degrade to TTS / no-op, not crashes.
4. **Heuristic voice routing** — deterministic category/subcategory rules; swap LLM later without changing the `ParsedTasksResponse` contract.

## Companion subsystem

`lib/companion/engine.ts` owns:

- Bio mood inference (`inferMood`, `moodFromTranscript`)
- Ritual gating (`shouldDeliverRitual`, `pickRitualForNow`)
- Hype window claims (`findHypeCandidates`, `claimHypeDelivery`)
- Memory queue (`enqueueMemory`, `popDueMemories`, follow-ups)
- Sync score (`bumpSync`, unlock tiers)

Scripts live in `lib/companion/scripts.ts` (rituals, hype, follow-up, vent validation, co-habit lines).

## Manifestation subsystem

`lib/manifestation/` owns:

- Seeded four-pillar deck (`seeds.ts`)
- Persisted deck (`storage.ts` key `@manifestation/deck/v1`)
- Dual-stem playback (`audio.ts`): Solfeggio WAV / WebAudio oscillator + recorded voice or TTS
- Mechanics: Voice Echo record → Reality Lock 60s → Vision prompt pin

Aura score on the deck is updated from Home Sync Score / completion signals via `setAuraScore`.

## Theme subsystem (scaffolding)

`lib/theme/` defines `light` | `dark` | `glass` tokens with AsyncStorage persistence. UI building blocks:

- `ThemeProvider` / `useTheme`
- `ThemePicker`, `ThemedCanvas`
- Theme-aware `PhoneShell`, `BottomDock`

Wire `ThemeProvider` in `app/_layout.tsx` and consume `useTheme()` on screens that still use the static `palette` export. See [THEMING.md](./THEMING.md).

## Data flow (reminders)

```
User input (mic sheet / form)
        │
        ▼
 parseVoiceTranscript() ──► FastAPI OR local parser
        │
        ▼
 ParsedTaskDraft[] ──► draftsToTasks() ──► ReminderTask[]
        │
        ▼
 upsertMany() ──► AsyncStorage
        │
        ├── scheduleReminderNotification()
        └── companion mood / inbound script update
```

## Extensibility hooks

| Hook | Env / field | Intent |
| --- | --- | --- |
| Voice API base | `EXPO_PUBLIC_API_URL` | Point at hosted router |
| Fast follow-ups | `EXPO_PUBLIC_FAST_FOLLOWUPS=1` | 15s follow-ups for demo |
| Vision synth | `EXPO_PUBLIC_VISION_API_URL` | Generative still/video (stub today) |
| Pillar `videoUri` | deck storage | Micro-video loop behind glass |
| Pillar `voiceUri` | Voice Echo | Self-voice stem |
