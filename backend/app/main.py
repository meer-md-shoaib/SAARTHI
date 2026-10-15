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
    EmergencyRescueRequest,
    EmergencyRescueResponse,
    HealthResponse,
    JargonRequest,
    JargonResponse,
    RescueStep,
    ScamRoleplayRequest,
    ScamRoleplayResponse,
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
    "/api/scan-qr",
    response_model=AnalyzePaymentResponse,
    responses={422: {"description": "Invalid input"}},
    tags=["analysis"],
)
@app.post(
    "/api/v1/scan-qr",
    response_model=AnalyzePaymentResponse,
    responses={422: {"description": "Invalid input"}},
    tags=["analysis"],
)
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
    if not is_upi and len(raw) >= 1:
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
                        severity=(
                            Severity.HIGH
                            if w.get("severity") == "high"
                            else (Severity.INFO if w.get("severity") == "info" else Severity.MEDIUM)
                        ),
                        title=w.get("title", "Safety Note"),
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


# --- Scam Roleplay Game ------------------------------------------------------

_SCRIPTED_ROLEPLAY: dict[str, list[str]] = {
    "fake_bank": [
        "This is urgent! Your bank account will be permanently blocked in 30 minutes unless you share the OTP you just received.",
        "Sir/Madam, I am calling from the bank fraud department. Tell me your UPI PIN or debit card details so we can reverse the suspicious transaction.",
        "You are making a serious mistake. Confirm your account details right now or your balance will be frozen.",
        "Last chance. Send a Rs 1 verification transfer to our secure portal or your account will be suspended today.",
    ],
    "lottery_email": [
        "Congratulations! Your prize of Rs 25 lakh from UK International Lottery is ready. Pay Rs 5,000 processing fee via UPI to release it immediately.",
        "This reward expires in 24 hours. Many winners have claimed. Do not miss your chance!",
        "Pay the fee now and the full prize will be transferred within 10 minutes - guaranteed.",
        "This is your final notice. Without the processing fee, we will cancel your reward.",
    ],
    "grandchild_emergency": [
        "Dadi/Dadu, please hurry! The doctor says I need Rs 15,000 immediately or they will not treat me.",
        "Please do not call Maa or Papa - I do not want them to panic. Just send the money quickly.",
        "I am in so much pain. Please send it to this emergency UPI number right now: arjun.care@ybl",
        "Why are you waiting? Every minute matters. Please just send the money!",
    ],
}

_ROLEPLAY_LESSONS: dict[str, dict[str, str]] = {
    "fake_bank": {
        "text": "Excellent instinct! Real banks NEVER ask for your OTP, UPI PIN, or account password over a phone call. When in doubt, hang up and call the official number printed on your debit card.",
        "hint": "Tip: Real banks and government agencies NEVER ask for OTP, PIN or passwords over the phone. Hang up and report to 1930.",
    },
    "lottery_email": {
        "text": "Brilliant! You cannot win a lottery you never entered. Legitimate prize schemes NEVER ask winners to pay fees upfront. Any processing fee request is always a scam.",
        "hint": "Tip: Legitimate prizes never require upfront payment. If someone asks you to pay money to receive money, it is always a scam.",
    },
    "grandchild_emergency": {
        "text": "Perfect instinct! Before sending money in any emergency, call another family member directly to verify. Scammers create fake urgency to stop you thinking clearly.",
        "hint": "Tip: Scammers pretend to be family members in emergencies. Always call back on a phone number you already know before sending any money.",
    },
}

_RESISTANCE_TRIGGERS = [
    "otp", "pin", "password", "i will not", "i won't", "no", "refuse", "hang up",
    "call back", "police", "real bank", "fake", "scam", "fraud", "verify",
    "official number", "family member", "not real", "suspicious", "report",
    "never entered", "won't pay", "will not pay", "cybercrime", "1930",
    "नहीं दूंगा", "ओटीपी नहीं", "पिन नहीं", "ನಾನು ಕೊಡುವುದಿಲ್ಲ", "ಒಟಿಪಿ ಇಲ್ಲ",
]


@app.post("/api/v1/scam-roleplay", response_model=ScamRoleplayResponse, tags=["games"])
async def scam_roleplay_endpoint(payload: ScamRoleplayRequest) -> ScamRoleplayResponse:
    """Interactive scam simulation training users to resist social engineering."""
    user_text = payload.user_message.strip()
    scenario = payload.scenario.strip().lower()

    # Check if user demonstrated scam resistance
    is_resistant = any(trigger in user_text.lower() for trigger in _RESISTANCE_TRIGGERS)
    if is_resistant:
        lesson = _ROLEPLAY_LESSONS.get(scenario, _ROLEPLAY_LESSONS["fake_bank"])
        return ScamRoleplayResponse(
            reply=lesson["text"],
            is_lesson=True,
            hint=lesson["hint"],
            success=True,
            audio_base64=None,
        )

    settings = get_settings()
    reply_text: str | None = None

    # Use Gemini 2.5 Flash for dynamic scammer roleplay when available
    if settings.gemini_api_key:
        from .gemini import get_gemini_service
        gemini_svc = get_gemini_service()
        reply_text = await gemini_svc.scam_roleplay_reply(
            scenario=scenario,
            user_message=user_text,
            history=payload.history,
            language=payload.language,
        )

    if not reply_text:
        scripted_lines = _SCRIPTED_ROLEPLAY.get(scenario, _SCRIPTED_ROLEPLAY["fake_bank"])
        turn_index = min(len(payload.history) // 2, len(scripted_lines) - 1)
        reply_text = scripted_lines[turn_index]

    # Synthesize audio so user can hear the simulated caller
    audio_b64: str | None = None
    try:
        tts_res = await get_voice_service().text_to_speech(
            text=reply_text, language=payload.language
        )
        if tts_res.get("status") == "ok":
            audio_b64 = tts_res.get("audio_base64")
    except Exception:
        pass

    return ScamRoleplayResponse(
        reply=reply_text,
        is_lesson=False,
        hint="Tip: Scammers create urgency to rush your decision. Ask for verification or refuse OTP/PIN.",
        success=False,
        audio_base64=audio_b64,
    )


# --- Jargon Buster ------------------------------------------------------------

_JARGON_DATA: dict[str, tuple[str, bool]] = {
    "upi pin": (
        "UPI PIN is your secret 4 or 6-digit password known ONLY to you. NEVER share it. Remember: You enter your PIN ONLY when SENDING money, NEVER when RECEIVING money.",
        True,
    ),
    "otp": (
        "OTP (One Time Password) is a temporary code sent by your bank to verify your identity. Never share OTP with anyone over the phone or SMS.",
        True,
    ),
    "vpa": (
        "VPA (Virtual Payment Address) is your UPI ID (like yourname@okicici or number@paytm). It is your public digital payment address — safe to share to receive money.",
        False,
    ),
    "collect request": (
        "A Collect Request is a prompt on your phone asking YOU to send money to someone. Scammers often send collect requests claiming they are sending you a refund or prize.",
        False,
    ),
    "chargeback": (
        "A formal dispute process through your bank or NPCI to retrieve money deducted due to unauthorized transactions or merchant fraud.",
        False,
    ),
    "digital arrest": (
        "A 100% scam! Real police, CBI, ED, and customs officers NEVER 'arrest' anyone over WhatsApp/Skype video calls or ask for money transfer to clear your name.",
        False,
    ),
    "apk scam": (
        "Malicious Android app files (.apk) sent over WhatsApp/SMS that give scammers control of your phone and read your OTPs. Never install APK files from unknown links.",
        False,
    ),
    "qr code": (
        "A Quick Response barcode. Scanning a merchant QR lets you PAY them. Remember: Scanning a QR code ALWAYS sends money out from your account; you do not need to scan a QR code to receive money.",
        False,
    ),
}


@app.post("/api/v1/translate-jargon", response_model=JargonResponse, tags=["knowledge"])
async def translate_jargon_endpoint(payload: JargonRequest) -> JargonResponse:
    """Explain banking and digital payment jargon in simple language for elders."""
    term_clean = payload.term.strip().lower()
    if term_clean in _JARGON_DATA:
        expl, keep_priv = _JARGON_DATA[term_clean]
        return JargonResponse(term=payload.term, explanation=expl, keep_private=keep_priv)

    settings = get_settings()
    if settings.gemini_api_key:
        from .gemini import get_gemini_service
        gemini_svc = get_gemini_service()
        gemini_expl = await gemini_svc.explain_jargon(term=payload.term, language=payload.language)
        if gemini_expl:
            is_secret = any(k in term_clean for k in ("pin", "otp", "password", "cvv"))
            return JargonResponse(term=payload.term, explanation=gemini_expl, keep_private=is_secret)

    return JargonResponse(
        term=payload.term,
        explanation=f"'{payload.term}' is a banking/payment term. Always verify with your bank or call 1930 if someone uses this term to pressure you into paying.",
        keep_private=False,
    )


# --- Emergency Rescue ---------------------------------------------------------

@app.post("/api/v1/emergency-rescue", response_model=EmergencyRescueResponse, tags=["emergency"])
async def emergency_rescue_endpoint(payload: EmergencyRescueRequest) -> EmergencyRescueResponse:
    """Generate instant fraud recovery steps and official cybercrime report template."""
    import datetime

    now_str = datetime.datetime.now().strftime("%d-%b-%Y %I:%M %p")
    steps = [
        RescueStep(
            step=1,
            action="Call the National Cybercrime Helpline immediately",
            detail="Dial 1930 (toll-free, 24/7). Report the transaction right away so police can request the recipient bank to freeze funds.",
            link="tel:1930",
        ),
        RescueStep(
            step=2,
            action="Call your bank to freeze UPI and debit card",
            detail="Call your bank's 24/7 fraud helpline and request an immediate freeze on your netbanking and debit card to prevent further unauthorized debits.",
            link="tel:1930",
        ),
        RescueStep(
            step=3,
            action="File an official complaint on cybercrime.gov.in",
            detail="Log in to https://cybercrime.gov.in and file a formal report under 'Financial Fraud' with your transaction ID and screenshots.",
            link="https://cybercrime.gov.in",
        ),
        RescueStep(
            step=4,
            action="Raise a transaction dispute on NPCI portal",
            detail="Visit the NPCI consumer dispute portal (https://www.npci.org.in) and register a complaint with your UPI reference number.",
            link="https://www.npci.org.in",
        ),
        RescueStep(
            step=5,
            action="Save all evidence and file an e-FIR",
            detail="Do not delete chat logs, phone numbers, or payment screenshots. Submit them to your local police cyber cell.",
            link=None,
        ),
    ]

    complaint_template = (
        f"INCIDENT REPORT FOR CYBERCRIME HELPLINE 1930 / CYBERCRIME.GOV.IN\n"
        f"Date & Time: {now_str}\n"
        f"Incident Description: {payload.description or 'Unauthorized / fraudulent online payment transaction'}\n"
        f"Amount Defrauded: Rs. {payload.amount_lost:,.2f}\n"
        f"Suspect UPI ID / Account Involved: {payload.upi_id_involved or 'Not provided'}\n"
        f"Request: Please freeze the beneficiary account and initiate refund under cybercrime SOP."
    )

    return EmergencyRescueResponse(
        helpline="1930",
        portal="https://cybercrime.gov.in",
        message="Act within the Golden Hour: the first 2 hours after a fraud are critical for banks to freeze the funds.",
        rescue_steps=steps,
        complaint_template=complaint_template,
    )


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
