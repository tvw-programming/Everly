# Everly

Zero-scroll executive companion + **Manifestation Command Deck** for high-velocity solo operators.

Task board: **Personal · Social · Professional**. Manifest tab: four pillars (**Personal · Social · Economical · Professional**) with identity scripts, dual-stem audio, Reality Lock, and Vision Studio.

## Quick start (mobile / Expo)

```bash
npm install
npm start          # port 19006
npm run web        # UI preview in browser
```

Use Expo Go on a device for notifications, MP3 playback, Voice Echo recording, and haptics. Web is for layout, voice-routing preview, and manifestation UI.

## Voice router API (optional)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 18765 --reload
```

- Docs: http://127.0.0.1:18765/docs  
- `POST /v1/voice/parse` — transcript → structured tasks  
- App falls back to an on-device heuristic parser if the API is down  
- Override URL with `EXPO_PUBLIC_API_URL`

## What’s in this slice

- Viewport-locked dashboard with three category quadrants
- Mic / Second Brain capture → multi-intent parse → route into buckets
- Companion: adaptive mood, rituals, hype interstitial, follow-ups, decompression room, Sync Score
- **Manifest tab:** quad-pillar matrix, Identity Shift + Solfeggio stems, Voice Echo recorder, 60s Reality Lock, Vision prompt pin
- Local notification + MP3 on device builds

## Project layout

```
app/                      Expo Router (index, add-reminder, manifest)
components/               Board, companion, manifestation UI
lib/companion/            Mood, rituals, hype, follow-up, sync
lib/manifestation/        Pillars, storage, dual-stem audio
plans/                    Companion + manifestation roadmaps
backend/                  FastAPI voice parse service
assets/sounds/            Demo MP3s
assets/manifestation/     Pillar stills + frequency tones
```

## Plans

- `plans/companion_relational_engine.md`
- `plans/manifestation_command_deck.md`
