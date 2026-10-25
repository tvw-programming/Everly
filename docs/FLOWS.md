# Flows

Mermaid diagrams render in GitHub / most Markdown previews. File paths point at the implementing modules.

---

## App boot

```mermaid
flowchart TD
  A[Expo AppEntry] --> B[App.tsx]
  B --> C[Load fonts + splash]
  B --> D[configureAudioMode native]
  B --> E[attachNotificationListeners]
  C --> F{fontsReady?}
  F -->|yes| G[React Navigation stack: Home / AddReminder / Ideas / Manifestation]
  F -->|timeout 2.5s| G
```

---

## Home session loop

```mermaid
flowchart TD
  H[index.tsx mount] --> L[loadReminders + loadSyncScore]
  L --> A[setAuraScore on Manifest deck]
  L --> R{Ritual for hour?}
  R -->|morning/evening not yet today| S[WarmInboundBubble ritual script]
  L --> HY[Poll hype candidates every 30s]
  L --> FU[Poll due memories every 20s]
  L --> LN{Hour 0–5?}
  LN -->|yes| DR[Offer late-night boundary / decompress]
```

### Complete a task

```mermaid
sequenceDiagram
  participant U as User
  participant Q as CategoryQuadrant
  participant I as index.tsx
  participant S as storage
  participant C as companion/engine
  participant B as WarmInboundBubble

  U->>Q: Tap task row
  Q->>I: onToggle(id, completed)
  I->>S: upsertReminder
  I->>C: recordCompletion + inferMood
  I->>C: scheduleFollowUpFast (if high-context)
  I->>B: buildReactionLine
```

---

## Voice → multi-bucket tasks

```mermaid
flowchart LR
  U[User transcript] --> VC[VoiceCapture]
  VC --> API[parseVoiceTranscript]
  API -->|ok| FA[FastAPI /v1/voice/parse]
  API -->|error/offline| LP[lib/parser.ts]
  FA --> PREV[Preview chips]
  LP --> PREV
  PREV --> SAVE[confirmSave → onParsed]
  SAVE --> DRAFT[draftsToTasks]
  DRAFT --> NOTIF[scheduleReminderNotification]
  DRAFT --> STORE[upsertMany]
  SAVE --> MOOD[moodFromTranscript]
```

**High-context follow-up eligibility** (`isHighContextTask`): trading / client / interview / deploy-like titles, or `contextTrigger` / elevated priority — see `lib/companion/scripts.ts`.

---

## Hype interstitial (pre-event)

```mermaid
flowchart TD
  T[findHypeCandidates] --> F{P1 or trading or contextTrigger?}
  F -->|no| X[Skip]
  F -->|yes| W{due in 0–10 minutes?}
  W -->|no| X
  W -->|yes| C[claimHypeDelivery once/day]
  C -->|claimed| H[HypeInterstitial + Speech + haptics]
  C -->|already delivered| X
```

---

## Decompression Room

```mermaid
stateDiagram-v2
  [*] --> Closed
  Closed --> Vent: long-press avatar / late night
  Vent --> Validate: "I am done talking"
  Validate --> Closed: Just rest
  Validate --> Preview: Make 3 tasks
  Preview --> Closed: Park & sleep (upsertMany)
```

---

## Manifestation Identity Shift

```mermaid
flowchart TD
  P[Tap pillar] --> ACT[setActiveId + companionHook]
  ACT --> AUD[playPillarAffirmation]
  AUD --> TONE{Platform}
  TONE -->|web| OSC[WebAudio sine @ frequencyHz]
  TONE -->|native| WAV[Bundled Solfeggio WAV]
  AUD --> VOICE{voiceUri?}
  VOICE -->|yes| LOOP[Loop recorded voice @ voiceMix]
  VOICE -->|no| TTS[expo-speech voiceScript]
```

### Reality Lock (60s)

```mermaid
sequenceDiagram
  participant U as User
  participant Card as Pillar / Hold bar
  participant RL as RealityLock
  participant A as manifestation/audio
  participant H as Home

  U->>Card: Long-press
  Card->>RL: setLockPillar
  RL->>A: playRealityLockAudio
  Note over RL: Timer 0→60s fullscreen
  A-->>RL: companion callback @ 50s
  RL->>RL: Speech "It is already yours..."
  RL->>RL: Haptic @ 60s (native)
  RL->>H: onComplete → router.replace('/')
```

### Voice Echo

```mermaid
flowchart TD
  V[Voice Echo sheet] --> P{Platform web?}
  P -->|yes| MSG[Show device-only message]
  P -->|no| REC[Audio.Recording HIGH_QUALITY]
  REC --> STOP[Stop & Save URI]
  STOP --> UP[updatePillar voiceUri]
```

### Vision Synthesizer (current)

```mermaid
flowchart LR
  VS[Vision Synth] --> IN[Edit prompt]
  IN --> SAVE[updatePillar visionPrompt]
  SAVE --> STUB[No image API yet]
  STUB -.-> GEN[Future: EXPO_PUBLIC_VISION_API_URL]
```

---

## Ideas vault capture

```mermaid
flowchart TD
  M[Mic FAB] --> C[Capture sheet]
  C --> O[organizeTranscript]
  O --> S[Split multi-intent chunks]
  S --> CAT[Detect category + kind + tags]
  CAT --> UP[upsertIdeas]
  UP --> CARD[Idea cards]
  CARD --> D[Detail sheet]
  D --> R[Convert to reminder]
  D --> MAN[Pin manifestation visionPrompt]
  D --> ARC[Archive / Delete]
```

---

## Storage write paths

| Action | Module | Key |
| --- | --- | --- |
| Upsert reminders | `lib/storage.ts` | `@reminders/v2` |
| Companion memories | `lib/companion/engine.ts` | `@companion/memories/v1` |
| Bio snapshot | same | `@companion/bio/v1` |
| Sync score | same | `@companion/sync/v1` |
| Ritual day stamps | same | `@companion/rituals/v1` |
| Hype claims | same | `@companion/hype-delivered/v1` |
| Completions/hour | same | `@companion/completions-hour/v1` |
| Manifest deck | `lib/manifestation/storage.ts` | `@manifestation/deck/v1` |
| Theme id | `lib/theme/storage.ts` | `@everly/theme/v1` |

All writers use AsyncStorage with web `localStorage` and in-memory fallbacks for restricted environments.
