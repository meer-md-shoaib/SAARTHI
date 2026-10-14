"""SAARTHI SafePay - FastAPI backend.

Endpoints
---------
GET  /health                     - service + voice configuration status
POST /api/v1/analyze-payment     - deterministic payment safety analysis
POST /api/v1/analyze-message     - ML message safety & fraud analysis
POST /api/v1/ask                 - Ask Saarthi (curated knowledge base + ML message assistance)
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
from .ml import get_message_analysis_service
from .schemas import (
    AnalyzeMessageRequest,
    AnalyzeMessageResponse,
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

# --- Security engine ---------------------------------------------------------

@app.post(
    "/api/v1/analyze-payment",
    response_model=AnalyzePaymentResponse,
    responses={422: {"description": "Invalid input"}},
    tags=["analysis"],
)
async def analyze(payload: AnalyzePaymentRequest) -> AnalyzePaymentResponse:
    """Analyze a payment QR, UPI address, or general communication message.

    If the input is an actual UPI payment QR code or VPA, it runs through the
    deterministic payment-safety rules engine.
    If the input is an SMS, message, warning, or link, it evaluates it with
    deep reasoning (using Gemini 2.5 Flash when available, or calibrated ML)
    rather than returning canned UPI errors.
    """
    import re
    from .engine import Outcome, Severity
    from .localization import get_strings
    from .schemas import ExtractedInfo, WarningSign

    raw = payload.raw_text.strip()
    is_upi = (
        raw.lower().startswith("upi://")
        or "pa=" in raw.lower()
        or bool(re.match(r"^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$", raw))
    )

    # 1. Non-UPI message or text: Think before replying instead of canned UPI errors
    if not is_upi and len(raw) > 5:
        settings = get_settings()
        lang = payload.language if payload.language in ("en", "hi", "kn") else "en"
        strings = get_strings(lang)

        # A. Use Gemini 2.5 Flash for deep contextual reasoning when key is configured
        if settings.gemini_api_key:
            from .gemini import get_gemini_service

            gemini_svc = get_gemini_service()
            gemini_res = await gemini_svc.analyze_message_or_content(
                text=raw, language=payload.language
            )
            if gemini_res:
                risk = gemini_res.get("risk_level", "medium")
                outcome_map = {
                    "high": Outcome.HIGH,
                    "medium": Outcome.CAREFUL,
                    "low": Outcome.LOW,
                }
                outcome = outcome_map.get(risk, Outcome.CAREFUL)
                warning_signs = [
                    WarningSign(
                        id=f"gemini_warning_{i}",
                        severity=Severity.HIGH if w.get("severity") == "high" else Severity.MEDIUM,
                        title=w.get("title", "Safety Warning"),
                        detail=w.get("detail", ""),
                    )
                    for i, w in enumerate(gemini_res.get("warning_signs", []))
                ]
                outcome_label = strings["outcomes"][outcome.value]["label"]
                return AnalyzePaymentResponse(
                    outcome=outcome,
                    outcome_label=outcome_label,
                    summary=gemini_res.get("summary") or gemini_res.get("title") or "Content Analysis",
                    explanation=gemini_res.get("explanation", ""),
                    warning_signs=warning_signs,
                    recommended_actions=gemini_res.get("recommended_actions") or [],
                    checks=[],
                    status_labels=strings["status_labels"],
                    extracted=ExtractedInfo(
                        kind="text",
                        payee_vpa=None,
                        payee_name=None,
                        amount=None,
                        amount_source=None,
                        currency=None,
                        note=None,
                        transaction_ref=None,
                        merchant_code=None,
                        link=None,
                        supported=True,
                    ),
                    insufficient_reasons=[],
                    disclaimer=strings["disclaimer"],
                    language=payload.language,
                    engine_version=f"gemini-{settings.gemini_model}",
                    ai_overrode_engine=True,
                )

        # B. Fallback to calibrated message classification service
        service = get_message_analysis_service()
        ml_res = service.analyze_message(text=raw, language=payload.language)
        risk = ml_res.get("risk_level", "medium")
        outcome_map = {
            "high": Outcome.HIGH,
            "medium": Outcome.CAREFUL,
            "low": Outcome.LOW,
        }
        outcome = outcome_map.get(risk, Outcome.CAREFUL)
        warning_signs = [
            WarningSign(
                id=f"ml_evidence_{i}",
                severity=Severity.HIGH if ml_res.get("category") == "scam" else Severity.MEDIUM,
                title=e.get("title", "Detected Signal"),
                detail=e.get("explanation", ""),
                evidence=e.get("snippet"),
            )
            for i, e in enumerate(ml_res.get("evidence", []))
        ]
        outcome_label = strings["outcomes"][outcome.value]["label"]
        return AnalyzePaymentResponse(
            outcome=outcome,
            outcome_label=outcome_label,
            summary=f"Message Safety: {ml_res.get('category', 'Message').title()} Risk",
            explanation=ml_res.get("explanation", ""),
            warning_signs=warning_signs,
            recommended_actions=ml_res.get("safe_next_steps", []),
            checks=[],
            status_labels=strings["status_labels"],
            extracted=ExtractedInfo(
                kind="text",
                payee_vpa=None,
                payee_name=None,
                amount=None,
                amount_source=None,
                currency=None,
                note=None,
                transaction_ref=None,
                merchant_code=None,
                link=None,
                supported=True,
            ),
            insufficient_reasons=[],
            disclaimer=strings["disclaimer"],
            language=payload.language,
            engine_version="ml-safety-classifier",
            ai_overrode_engine=True,
        )

    # 2. UPI payment: Run deterministic payment rules engine
    result: dict[str, Any] = analyze_payment(
        raw_text=payload.raw_text,
        intention=payload.intention,
        expected_amount=payload.expected_amount,
        language=payload.language,
    )
    return AnalyzePaymentResponse(**result)


@app.post(
    "/api/v1/analyze-message",
    response_model=AnalyzeMessageResponse,
    responses={422: {"description": "Invalid input"}},
    tags=["analysis"],
)
async def analyze_message_endpoint(payload: AnalyzeMessageRequest) -> AnalyzeMessageResponse:
    """Analyze a communication or SMS text for fraud and scam indicators."""
    service = get_message_analysis_service()
    result = service.analyze_message(text=payload.message, language=payload.language)
    return AnalyzeMessageResponse(**result)


# --- Ask Saarthi --------------------------------------------------------------

@app.post("/api/v1/ask", response_model=AskResponse, tags=["assistant"])
async def ask(payload: AskRequest) -> AskResponse:
    """Answer a safety question via Gemini AI or curated knowledge base."""
    settings = get_settings()

    # 1. Primary: Use Gemini 2.5 Flash for natural, easy-to-understand response
    if settings.gemini_api_key and not payload.topic_id:
        from .gemini import get_gemini_service
        from .schemas import SuggestedTopic

        gemini_svc = get_gemini_service()
        gemini_answer = await gemini_svc.answer_safety_question(
            question=payload.text,
            language=payload.language,
            context=payload.context,
        )
        if gemini_answer:
            title_map = {
                "en": "Saarthi AI Safety Advice",
                "hi": "सारथी AI सुरक्षा सलाह",
                "kn": "ಸಾರಥಿ AI ಸುರಕ್ಷತಾ ಸಲಹೆ",
            }
            suggested = [
                SuggestedTopic(topic_id="otp", title="Should I share my OTP?"),
                SuggestedTopic(topic_id="qr_check", title="How to check QR safely?"),
                SuggestedTopic(topic_id="already_paid", title="I already sent money"),
            ]
            return AskResponse(
                topic_id="gemini_assistant",
                question=payload.text,
                title=title_map.get(payload.language, title_map["en"]),
                answer=gemini_answer,
                suggested=suggested,
                language=payload.language,
                answered_by="gemini_ai",
            )

    # 2. Secondary / Chip selection: Curated trilingual knowledge base
    result = answer_question(
        text=payload.text,
        language=payload.language,
        topic_id=payload.topic_id,
        context=payload.context,
    )
    return AskResponse(**result)


# --- Voice --------------------------------------------------------------------

@app.post("/api/v1/speech-to-text", response_model=SpeechToTextResponse, tags=["voice"])
async def speech_to_text(
    file: UploadFile = File(..., description="Recorded audio (webm, mp4, ogg, wav, mp3, m4a)"),
    language: str = Form("en", description="Language code (e.g. en, hi, kn, bn, gu, ml, mr, od, pa, ta, te, auto, codemix)"),
) -> SpeechToTextResponse:
    """Transcribe audio with Sarvam saaras:v4, or report an honest fallback."""
    from .voice import SAARAS_V4_LANGUAGES

    clean_lang = language.strip().lower()
    if clean_lang not in ("auto", "codemix") and clean_lang not in SAARAS_V4_LANGUAGES:
        raise HTTPException(
            status_code=422,
            detail=f"language '{language}' not supported. Must be an Indic language code (e.g. en, hi, kn, bn, gu, ml, mr, od, pa, ta, te), 'auto', or 'codemix'.",
        )

    audio = await file.read()
    result = await get_voice_service().speech_to_text(
        audio=audio,
        filename=file.filename or "recording.webm",
        content_type=file.content_type,
        language=clean_lang,
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
