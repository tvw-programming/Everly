# Everly

Zero-scroll executive companion + **Manifestation Command Deck** for high-velocity solo operators.

- **Home:** Personal · Social · Professional reminder board with a warm AI companion  
- **Manifest:** Personal · Social · Economical · Professional identity pillars (audio, Reality Lock, Vision prompts)  
- **Voice router:** Optional FastAPI multi-intent parse (offline heuristic fallback)

## Documentation (start here)

| Doc | Description |
| --- | --- |
| **[docs/README.md](./docs/README.md)** | Docs index |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Stack, modules, topology |
| [docs/FEATURES.md](./docs/FEATURES.md) | Feature inventory + status |
| [docs/FLOWS.md](./docs/FLOWS.md) | User/system flow diagrams |
| [docs/DATA-MODELS.md](./docs/DATA-MODELS.md) | Types & storage keys |
| [docs/API.md](./docs/API.md) | Voice router HTTP contract |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | Local setup & QA checklist |
| [docs/THEMING.md](./docs/THEMING.md) | Light / Dark / 3D Glass themes |

Roadmaps: [`plans/`](./plans/) · Backend: [`backend/README.md`](./backend/README.md)

## Quick start

```bash
npm install
npm start          # Expo on port 19006
npm run web        # Browser preview → http://127.0.0.1:19006
```

```bash
# Optional voice API
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 18765 --reload
```

- App: http://127.0.0.1:19006  
- API docs: http://127.0.0.1:18765/docs  
- Override API: `EXPO_PUBLIC_API_URL`

Use **Expo Go** for notifications, MP3, Voice Echo recording, and haptics. Web is for layout, voice-routing preview, and manifestation UI.

## What’s in this slice

- Viewport-locked dashboard with three category quadrants  
- Mic / Second Brain capture → multi-intent parse → route into buckets  
- Companion: adaptive mood, rituals, hype interstitial, follow-ups, decompression room, Sync Score  
- Manifest tab: quad-pillar matrix, Identity Shift + Solfeggio stems, Voice Echo, 60s Reality Lock, Vision prompt pin  
- Theme token system (Light / Dark / 3D Glass) — see [docs/THEMING.md](./docs/THEMING.md)  
- Local notification + MP3 on device builds  

## Project layout

```
app/                      Expo Router (index, add-reminder, manifestation)
components/               Board, companion, manifestation, theme UI
lib/companion/            Mood, rituals, hype, follow-up, sync
lib/manifestation/        Pillars, storage, dual-stem audio
lib/theme/                Light / Dark / Glass tokens + persistence
docs/                     Developer technical documentation
plans/                    Companion + manifestation roadmaps
backend/                  FastAPI voice parse service
assets/sounds/            Demo MP3s
assets/manifestation/     Pillar stills + frequency tones
```

## Typecheck

```bash
npx tsc --noEmit
```
