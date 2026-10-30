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

## 5. Ideas Tab (Voice-First Vault)

| Feature | Status | Notes |
| --- | --- | --- |
| Ideas dashboard + All/Personal/Social/Pro filters | Shipped | `app/ideas.tsx` |
| Weekly insight line | Shipped | `weekInsight()` |
| Idea cards + detail sheet | Shipped | Status lifecycle, tags, companion |
| Mic FAB state machine | Shipped | idle / listening / processing / saved |
| Multi-intent organize | Shipped | `lib/ideas/organize.ts` |
| Content hooks / platforms | Shipped | Social ideas |
| Trade research safeguard | Shipped | No impulse trade action |
| Convert → reminder | Shipped | Links reminder id on idea |
| Pin → manifestation pillar | Shipped | Vision prompt patch |
| Native audio waveform / speeds | Planned | Web uses TTS preview |
| Routine Experiment Builder UI | Partial | Detected + companion prompt |
| Weekly Idea Review | Planned | |
| NL search + privacy locks | Planned | |

---

## 6. Practice Engine (Marathi / if-then)

| Feature | Status | Notes |
| --- | --- | --- |
| Statement library + seed set (M/H/R + bench) | Shipped | `lib/practice/` — `@practice/v1/*` |
| Active set caps 10+10+3 + bench/swap | Shipped | Cap prompt on activate |
| Evening manifest session (hold 3s + 4s silence) | Shipped | `/practice-session` |
| Cue cards + Start + timers (H1/H4) | Shipped | Practice tab |
| Title-only scheduled triggers (MT1, HT4–HT5, HT7–HT10) | Shipped | `lib/practice/notifications.ts` |
| Weekly input scoreboard + HT11 behind-pace | Shipped | No outcome fields |
| Setback flow F10 (log → M4 → H2) | Shipped | Practice home |
| WOOP (Outcome 2-min gate) | Shipped | `/practice-woop` |
| Rotation boxes + monthly review flags | Shipped | F5 / F11 |
| Wins file + Read three | Shipped | H5 prompt + review |
| Own voice clips | Shipped | `/practice-voice` (optional) |
| Local export | Shipped | JSON bundle from review |

---

## 7. Personal Android Alarms

| Feature | Status | Notes |
| --- | --- | --- |
| Alarms tab + cards (enable / edit / delete / test) | Shipped | `app/(tabs)/alarms.tsx` |
| Add/Edit 12h form (category, repeat, audio, snooze) | Shipped | `app/alarm-edit.tsx` |
| Reliability checklist (exact alarm + battery) | Shipped | `app/alarm-reliability.tsx` |
| Active alarm Stop / Snooze / Done UI | Shipped | `app/alarm-active.tsx` |
| Launch / foreground reschedule + missed list | Shipped | `lib/alarms/bootstrap.ts` — no auto-play of missed |
| Thin `everly-alarm` native module (AlarmManager + FGS) | Shipped | `modules/everly-alarm` — needs custom APK |
| Native advance-after-fire for recurring | Shipped | Kotlin `AlarmScheduler.advanceAfterFire` |
| Expo Go / web fallback via `expo-notifications` | Shipped | UI works; no closed-app full-song |

Plan: [`plans/android_alarm_reminder_native.md`](../plans/android_alarm_reminder_native.md).

---

## 8. Theming

| Feature | Status | Notes |
| --- | --- | --- |
| Theme token set (light / dark / glass) | Partial | `lib/theme/themes.ts` |
| Persist theme id | Partial | `@everly/theme/v1` |
| ThemePicker UI | Partial | Component present |
| ThemedCanvas orbs / CSS gradients | Partial | Component present |
| Full screen migration off static `palette` | Planned | Wire provider + replace StyleSheets |

See [THEMING.md](./THEMING.md).

---

## 9. Platform matrix

| Capability | iOS / Android (Expo Go) | Sideloaded APK | Web preview |
| --- | --- | --- | --- |
| Board + Manifest UI | Yes | Yes | Yes |
| Voice parse (API or local) | Yes | Yes | Yes (paste) |
| Local notifications | Yes | Yes | Limited / no-op warnings |
| Exact alarms + closed-app music | Fallback only | Yes (`everly-alarm`) | No |
| MP3 playback | Yes | Yes | Partial |
| Voice Echo recording | Yes | Yes | Blocked with message |
| Haptics | Yes | Yes | No |
| Solfeggio WAV stems | Yes | Yes | WebAudio oscillator fallback |
| CSS glass gradients | N/A | N/A | Best on web |
