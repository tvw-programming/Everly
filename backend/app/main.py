from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .models import ParsedTasksResponse, VoiceIngestPayload
from .parser import parse_transcript

app = FastAPI(
    title="Everly Voice Router",
    description="Contextual Second Brain — speech → structured Personal/Social/Professional tasks",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"ok": True, "service": "everly-voice-router"}


@app.post("/v1/voice/parse", response_model=ParsedTasksResponse)
def voice_parse(payload: VoiceIngestPayload) -> ParsedTasksResponse:
    """Deterministic JSON decomposition of a multi-intent voice transcript."""
    return parse_transcript(payload.raw_transcript, payload.device_timestamp)


@app.get("/")
def root():
    return {
        "name": "Everly Voice Router",
        "docs": "/docs",
        "parse": "POST /v1/voice/parse",
    }
