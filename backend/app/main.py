"""SAARTHI SafePay - FastAPI backend.

Endpoints
---------
GET  /health                     - service + voice configuration status
POST /api/v1/analyze-payment     - deterministic payment safety analysis
POST /api/v1/ask                 - Ask Saarthi (curated knowledge base)
POST /api/v1/speech-to-text      - Sarvam saaras:v4 transcription (or honest fallback)
POST /api/v1/text-to-speech      - Sarvam bulbul:v3 synthesis (or honest fallback)
GET  /api/v1/voice-config        - whether voice services are configured
"""

from __future__ import annotations

import logging
import mimetypes
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from .config import get_settings
from .engine import ENGINE_VERSION, analyze_payment
from .knowledge import answer_question
from .schemas import (
    AnalyzePaymentRequest,
    AnalyzePaymentResponse,
    AskRequest,
    AskResponse,
    HealthResponse,
    SpeechToTextResponse,
    TextToSpeechRequest,
    TextToSpeechResponse,
    VoiceConfigResponse,
)
from .voice import close_voice_service, get_voice_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("saarthi.api")

APP_VERSION = "1.0.0"
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    yield
    await close_voice_service()


app = FastAPI(
    title="SAARTHI SafePay API",
    description=(
        "Digital payment safety assistant backend: deterministic QR/payment "
        "analysis plus optional Sarvam voice services with text fallbacks."
    ),
    version=APP_VERSION,
    lifespan=lifespan,
)

cors_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --- Health ------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    current = get_settings()
    return HealthResponse(
        status="ok",
        service="saarthi-safepay",
        version=APP_VERSION,
        engine_version=ENGINE_VERSION,
        voice=VoiceConfigResponse(
            stt_configured=current.stt_configured,
            tts_configured=current.tts_configured,
            stt_model=current.stt_model,
            tts_model=current.tts_model,
        ),
    )


@app.get("/api/v1/voice-config", response_model=VoiceConfigResponse, tags=["voice"])
async def voice_config() -> VoiceConfigResponse:
    current = get_settings()
    return VoiceConfigResponse(
        stt_configured=current.stt_configured,
        tts_configured=current.tts_configured,
        stt_model=current.stt_model,
        tts_model=current.tts_model,
    )


# --- Security engine ---------------------------------------------------------

@app.post(
    "/api/v1/analyze-payment",
    response_model=AnalyzePaymentResponse,
    responses={422: {"description": "Invalid input"}},
    tags=["analysis"],
)
async def analyze(payload: AnalyzePaymentRequest) -> AnalyzePaymentResponse:
    """Run the deterministic rules engine.

    The verdict comes exclusively from explicit Python rules. No AI service is
    consulted and ``ai_overrode_engine`` is always ``False``.
    """
    result: dict[str, Any] = analyze_payment(
        raw_text=payload.raw_text,
        intention=payload.intention,
        expected_amount=payload.expected_amount,
        language=payload.language,
    )
    return AnalyzePaymentResponse(**result)


# --- Ask Saarthi --------------------------------------------------------------

@app.post("/api/v1/ask", response_model=AskResponse, tags=["assistant"])
async def ask(payload: AskRequest) -> AskResponse:
    """Answer a safety question from the curated trilingual knowledge base."""
    result = answer_question(
        text=payload.text, language=payload.language, topic_id=payload.topic_id
    )
    return AskResponse(**result)


# --- Voice --------------------------------------------------------------------

@app.post("/api/v1/speech-to-text", response_model=SpeechToTextResponse, tags=["voice"])
async def speech_to_text(
    file: UploadFile = File(..., description="Recorded audio (webm, mp4, ogg or wav)"),
    language: str = Form("en", description="en | hi | kn"),
) -> SpeechToTextResponse:
    """Transcribe audio with Sarvam saaras:v4, or report an honest fallback."""
    if language not in ("en", "hi", "kn"):
        raise HTTPException(status_code=422, detail="language must be one of: en, hi, kn")

    audio = await file.read()
    result = await get_voice_service().speech_to_text(
        audio=audio,
        filename=file.filename or "recording.webm",
        content_type=file.content_type,
        language=language,
    )
    return SpeechToTextResponse(**result)


@app.post("/api/v1/text-to-speech", response_model=TextToSpeechResponse, tags=["voice"])
async def text_to_speech(payload: TextToSpeechRequest) -> TextToSpeechResponse:
    """Synthesise speech with Sarvam bulbul:v3, or report the browser-voice fallback."""
    result = await get_voice_service().text_to_speech(
        text=payload.text, language=payload.language
    )
    return TextToSpeechResponse(**result)


# --- Errors -------------------------------------------------------------------

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return plain-language validation errors for the UI."""
    detail = "Invalid input."
    errors = exc.errors()
    if errors:
        first = errors[0]
        location = ".".join(str(part) for part in first.get("loc", ()) if part != "body")
        message = str(first.get("msg", detail))
        detail = f"{location}: {message}" if location else message
    return JSONResponse(status_code=422, content={"detail": detail})


# --- Static frontend (optional single-server demo) ----------------------------

@app.get("/{full_path:path}", include_in_schema=False)
async def spa(full_path: str) -> Any:
    """Serve the built frontend when ``frontend/dist`` exists (SPA fallback)."""
    if full_path.startswith("api/") or full_path == "health":
        return JSONResponse(status_code=404, content={"detail": "Not found"})

    if not FRONTEND_DIST.is_dir():
        return JSONResponse(
            content={
                "detail": (
                    "Frontend build not found. Run `npm run dev` in frontend/ or "
                    "`npm run build` to serve it from this server."
                )
            },
            status_code=404,
        )

    candidate = (FRONTEND_DIST / full_path).resolve()
    if full_path and candidate.is_file() and candidate.is_relative_to(FRONTEND_DIST.resolve()):
        media_type, _ = mimetypes.guess_type(str(candidate))
        return FileResponse(candidate, media_type=media_type)

    index = FRONTEND_DIST / "index.html"
    if index.is_file():
        return FileResponse(index, media_type="text/html")
    return JSONResponse(status_code=404, content={"detail": "Not found"})
