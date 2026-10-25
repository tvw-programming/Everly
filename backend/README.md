# Everly Voice Router

FastAPI service that turns a raw voice transcript into structured Personal / Social / Professional tasks.

```bash
# Python 3.10–3.12 (pinned pydantic has no 3.14 wheels)
python3.12 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 18765 --reload
```

`POST /v1/voice/parse`:

```json
{
  "raw_transcript": "Took 500ml water, check Nifty at 9:15 AM, post the demo on X at 6 PM",
  "audio_duration_seconds": 4.2,
  "device_timestamp": "2026-10-24T08:00:00Z"
}
```

Heuristic classifier for v1 (no LLM key required). Swap in structured LLM outputs later without changing the response contract.
