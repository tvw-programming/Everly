# Development Runbook

## Prerequisites

- Node 20+ (repo uses Expo 58)
- npm
- Python 3.10+ for the voice router
- Optional: Expo Go on a phone for notifications / mic / haptics

## Install

```bash
npm install
cd backend && python3 -m pip install -r requirements.txt && cd ..
```

On some Linux images `python3 -m venv` needs `python3-venv`; system/user pip install is enough for local API.

## Run app

```bash
npm start          # Metro + Expo, port 19006
npm run web        # Browser UI on http://127.0.0.1:19006
```

## Run voice API

```bash
cd backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 18765 --reload
```

Health check: `curl http://127.0.0.1:18765/health`

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `http://127.0.0.1:18765` | Voice router base |
| `EXPO_PUBLIC_FAST_FOLLOWUPS` | unset | `1` → follow-ups fire in ~15s |
| `EXPO_PUBLIC_VISION_API_URL` | unset | Future Vision Synthesizer endpoint |

Set via shell export or Expo `.env` (remember `EXPO_PUBLIC_*` is inlined at bundle time).

## Typecheck

```bash
npx tsc --noEmit
```

No Jest suite in this slice; prefer manual QA on web + Expo Go for device-only paths (Voice Echo, haptics, notifications).

## Path aliases

`tsconfig` maps `@/` → repo root (e.g. `@/lib/storage`, `@/components/PhoneShell`).

## Conventions

1. **Viewport lock** — Prefer `flex: 1` + `minHeight: 0` over `ScrollView` on Home/Manifest primary chrome.
2. **Fail open** — Audio, haptics, notifications, AsyncStorage: catch and degrade.
3. **Snake ↔ camel** — Wire formats for FastAPI stay snake_case; map at `lib/api.ts`.
4. **Storage merges** — Manifestation deck overlays seed on load so copy updates do not wipe user media URIs.
5. **Companion writes** — Gate rituals/hype with day keys to avoid spam.
6. **Do not invent auth** — Local-first; no user accounts in this slice.

## Manual QA checklist

### Home

- [ ] Three quadrants render without page scroll inside PhoneShell
- [ ] Toggle task completion → companion reaction
- [ ] Voice sheet routes multi-intent sample transcript
- [ ] Sync chips increment Sync Score
- [ ] Long-press avatar opens Decompression Room
- [ ] Manifest dock navigates to `/manifestation`

### Manifest

- [ ] Four pillars visible with identity scripts
- [ ] Tap pillar plays tone + TTS (web) or WAV (device)
- [ ] Voice mix chips change mix label
- [ ] Long-press opens Reality Lock; Skip returns; complete routes Home
- [ ] Voice Echo / Vision Synth sheets open
- [ ] Identity Code edits persist after blur

### API

- [ ] `POST /v1/voice/parse` returns `parsed_items`
- [ ] Killing API still allows VoiceCapture via local parser

## Project layout cheat sheet

```
app/                 routes
components/          UI
lib/                 domain logic
backend/             FastAPI
assets/              fonts, sounds, manifestation media
plans/               product roadmaps
docs/                technical documentation (you are here)
```

## Remotes

Development may push to:

- Cursor Origin remote (cloud agent workspace)
- GitHub `tvw-programming/Everly`

Prefer small, descriptive commits (`feat(companion):…`, `feat(manifestation):…`, `docs:…`).

## Known limitations

- Web: no Voice Echo recording; notification listeners warn; `useNativeDriver` anim warnings
- `expo-av` deprecation toward `expo-audio` / `expo-video` (migrate later)
- Theme provider not yet wrapping all screens that still import static `palette` — see [THEMING.md](./THEMING.md)
- Vision Synthesizer stores prompts only
