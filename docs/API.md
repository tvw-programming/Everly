# Voice Router API

Service: `backend/` (FastAPI). Default bind: `0.0.0.0:18765`.

OpenAPI UI: `http://127.0.0.1:18765/docs`

Client: `lib/api.ts` (`EXPO_PUBLIC_API_URL` overrides base URL).

---

## Endpoints

### `GET /health`

```json
{ "ok": true, "service": "everly-voice-router" }
```

### `GET /`

Service discovery blob (`name`, `docs`, `parse`).

### `POST /v1/voice/parse`

Deterministic multi-intent decomposition. No auth in v1 (local/dev).

**Request**

```json
{
  "raw_transcript": "Took 500ml water, check Nifty at 9:15 AM, post the demo on X at 6 PM",
  "audio_duration_seconds": 4.2,
  "device_timestamp": "2026-10-24T08:00:00Z"
}
```

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `raw_transcript` | string | yes | Free text / STT output |
| `audio_duration_seconds` | number | no | Reserved for future rapid-speech heuristics |
| `device_timestamp` | ISO string | no | Anchors relative times (“in 15 minutes”) |

**Response** (`ParsedTasksResponse`)

```json
{
  "parsed_items": [
    {
      "title": "Drink 500ml water",
      "category": "personal",
      "sub_category": "hydration",
      "priority": "p2",
      "due_at": null,
      "context_trigger": null
    }
  ],
  "unresolved_notes": null
}
```

Snake_case on the wire; the Expo client maps to camelCase `ParsedTaskDraft`.

---

## Classification notes (v1 heuristic)

Implemented in `backend/app/parser.py` (and mirrored loosely in `lib/parser.ts`):

- Split on commas / “and” / sentence boundaries for multi-intent
- Keyword → subcategory → category (e.g. water → hydration → personal; Nifty → trading → professional)
- Time phrases → `due_at` / schedule hints when possible
- Unparsed remainder may surface in `unresolved_notes`

Swap to an LLM structured-output backend later **without** changing the response model.

---

## CORS

Wide open (`allow_origins=["*"]`) for local Expo web. Tighten before public deploy.

---

## Client fallback

```ts
try {
  // fetch EXPO_PUBLIC_API_URL/v1/voice/parse
} catch {
  return parseTranscriptLocally(rawTranscript);
}
```

Never surface a hard failure to the user for “API down”; show local routing instead.

---

## Run locally

```bash
cd backend
python3 -m pip install -r requirements.txt   # or venv if available
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 18765 --reload
```

Dependencies: see `backend/requirements.txt` (`fastapi`, `uvicorn`, `pydantic`).
