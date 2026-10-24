# Features Inventory

Status legend: **Shipped** · **Partial** (UI/API stub) · **Planned**

---

## 1. Reminder Command Board (Home)

| Feature | Status | Notes |
| --- | --- | --- |
| Zero-scroll three-quadrant board | Shipped | Personal · Social · Professional |
| Top-N tasks per quadrant + overflow sheet | Shipped | `CategoryQuadrant` (`TOP_N = 2`) |
| Toggle complete / incomplete | Shipped | Updates storage + companion reaction |
| Manual create form | Shipped | `/add-reminder` |
| Category accents | Shipped | `constants/Colors.ts` → `categoryAccent` |
| PhoneShell framing on web | Shipped | ~390×780 device chrome |
| Local notifications + MP3 | Shipped | Device builds; limited on web |
| TTS reminder mode | Partial | Sound model supports `tts`; primary path is MP3 |

### Task taxonomy

- **Categories:** `personal`, `social`, `professional`
- **Subcategories:** hydration, medication, exercise, manifestation, content_post, networking, idea_capture, trading, dev_sprint, client_ops, general
- **Priority:** `p1` · `p2` · `p3` (sort weight in `PRIORITY_WEIGHT`)

---

## 2. Contextual Second Brain (Voice capture)

| Feature | Status | Notes |
| --- | --- | --- |
| Mic FAB → sheet | Shipped | `VoiceCapture` |
| Multi-intent paste/type (web) | Shipped | Device STT planned; web uses text |
| FastAPI parse | Shipped | `POST /v1/voice/parse` |
| Offline heuristic parse | Shipped | `lib/parser.ts` fallback |
| Preview routed tasks before save | Shipped | Confirm → `upsertMany` |
| Mood signal from transcript | Shipped | `onTranscriptMood` + `moodFromTranscript` |

Example transcript:

> Took 500ml water, check Nifty options at 9:15 AM, post the AI demo on X at 6 PM

→ Personal hydration + Professional trading + Social content_post.

---

## 3. Companion Relational Engine

| Feature | Phase | Status | Entry points |
| --- | --- | --- | --- |
| Ambient avatar visual states | P0–1 | Shipped | `AmbientAvatar` |
| Morning / evening rituals | P1 | Shipped | `pickRitualForNow` + TTS bubble |
| Adaptive mood scripts | P2 | Shipped | calm / hype / soothing / grounded |
| Pre-event hype interstitial | P2 | Shipped | 10-min window, P1 / trading / context |
| Haptics on hype | P2 | Shipped | Native only |
| Follow-up memories after high-context done | P3 | Shipped | 3h default; 15s with fast flag |
| Decompression Room | P3 | Shipped | Long-press avatar / late night |
| Vent → validate → optional 3 tasks | P3 | Shipped | Reuses voice parse |
| Sync Score co-habits | P4 | Shipped | Hydration + Move chips |
| Unlock tiers | P4 | Shipped | Every 5 syncs → tier |
| Late-night boundary line | P3 | Shipped | 00:00–05:00 |
| Calendar-linked pillar routing | — | Planned | Manifestation Phase 4 |
| Neural companion TTS voice | — | Planned | Replace `expo-speech` |

---

## 4. Manifestation Command Deck

| Feature | Status | Notes |
| --- | --- | --- |
| Quad-pillar viewport matrix | Shipped | Personal · Social · Economical · Professional |
| Glassmorphic pillar cards + still imagery | Shipped | Unsplash stills in seed deck |
| Identity Code header (editable) | Shipped | Persisted on deck |
| Aura Score | Shipped | Synced from Home sync/completions |
| Tap pillar → Identity Shift audio | Shipped | Dual-stem: tone + voice/TTS |
| Voice mix chips (20/30/50%) | Shipped | `setVoiceMix` |
| Silence control | Shipped | Stops stems |
| Voice Echo recorder | Shipped | Device; web shows guidance |
| 60s Reality Lock | Shipped | Companion line @ ~50s, haptic, return Home |
| Vision Synthesizer prompt pin | Partial | Stores prompt; generative API stub |
| Micro-video loops | Partial | `videoUri` on model; player not primary yet |
| 8D spatial pan | Planned | Voice Echo enhancement |
| Generative still/video API | Planned | `EXPO_PUBLIC_VISION_API_URL` |

### Pillar carriers

| Pillar | Accent | Hz | Intent |
| --- | --- | --- | --- |
| Personal | Cyan | 528 | Vitality / transformation |
| Social | Amber | 639 | Relationships |
| Economical | Gold | 888 | Abundance |
| Professional | Emerald | 40 | Gamma / deep work |

Bundled WAVs: `assets/manifestation/tones/hz{40,528,639,888}.wav`. Web uses WebAudio sine oscillator.

---

## 5. Theming

| Feature | Status | Notes |
| --- | --- | --- |
| Theme token set (light / dark / glass) | Partial | `lib/theme/themes.ts` |
| Persist theme id | Partial | `@everly/theme/v1` |
| ThemePicker UI | Partial | Component present |
| ThemedCanvas orbs / CSS gradients | Partial | Component present |
| Full screen migration off static `palette` | Planned | Wire provider + replace StyleSheets |

See [THEMING.md](./THEMING.md).

---

## 6. Platform matrix

| Capability | iOS / Android (Expo Go) | Web preview |
| --- | --- | --- |
| Board + Manifest UI | Yes | Yes |
| Voice parse (API or local) | Yes | Yes (paste) |
| Local notifications | Yes | Limited / no-op warnings |
| MP3 playback | Yes | Partial |
| Voice Echo recording | Yes | Blocked with message |
| Haptics | Yes | No |
| Solfeggio WAV stems | Yes | WebAudio oscillator fallback |
| CSS glass gradients | N/A | Best on web |
