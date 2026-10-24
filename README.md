# Everly

Zero-scroll executive companion for high-velocity solo operators.

Three buckets — **Personal**, **Social**, **Professional** — with voice-driven capture, local MP3 reminders, and a warm companion presence (avatar + skippable inbound voice notes).

## Quick start (mobile / Expo)

```bash
npm install
npm start          # port 19006
npm run web        # UI preview in browser
```

Use Expo Go on a device for notifications + timed MP3 playback. Web is for layout and voice-routing preview (type/paste thoughts).

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

- Viewport-locked dashboard with three category quadrants (top 2 tasks + `+N more` sheet)
- Mic / Second Brain capture → multi-intent parse → route into buckets
- Manual multi-step add form (`+`)
- Ambient companion avatar (idle / listening / reacting / speaking)
- Morning & evening warm inbound voice notes (skippable, ≤12s via `expo-speech`)
- Local notification + MP3 on device builds

## Project layout

```
app/                 Expo Router screens
components/          Dashboard, avatar, voice, forms
lib/                 Types, storage, parser, companion engine
backend/             FastAPI voice parse service
assets/sounds/       Demo MP3s
```

## Next (planned)

Adaptive mood, pre-event hype interstitial, relational follow-through, decompression room, shared Sync Score — see companion plan in the agent artifacts.
