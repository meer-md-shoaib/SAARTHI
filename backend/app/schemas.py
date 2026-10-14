"""Pydantic request/response models for the SAARTHI SafePay API."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

Language = Literal[
    "en", "hi", "kn", "bn", "gu", "ml", "mr", "od", "or", "pa", "ta", "te"
]
Intention = Literal["pay", "receive", "unknown"]
OutcomeValue = Literal["low_concern", "be_careful", "high_concern", "unable_to_verify"]
Source = Literal["camera", "manual", "demo"]


class AnalyzePaymentRequest(BaseModel):
    """Input for the deterministic security engine.

    Only payment information needed for analysis is accepted. The API never
    receives, stores or forwards UPI PINs, OTPs, passwords or card secrets -
    :meth:`validate_no_secrets` rejects payloads that contain them.
    """

    raw_text: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Scanned QR payload, pasted UPI link, or message text.",
    )
    intention: Intention = Field(
        "unknown",
        description="Does the user intend to pay money or receive money?",
    )
    expected_amount: float | None = Field(
        None,
        ge=0,
        le=10_000_000,
        description="Amount the user expects, when applicable.",
    )
    language: Language = "en"
    source: Source = "manual"

    @field_validator("raw_text")
    @classmethod
    def strip_raw_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("raw_text must not be empty")
        return cleaned


class ExtractedInfo(BaseModel):
    kind: str
    payee_vpa: str | None = None
    payee_name: str | None = None
    amount: float | None = None
    amount_source: str | None = None
    currency: str | None = None
    note: str | None = None
    transaction_ref: str | None = None
    merchant_code: str | None = None
    link: str | None = None
    supported: bool


class WarningSign(BaseModel):
    id: str
    severity: Literal["high", "medium", "info"]
    title: str
    detail: str
    evidence: str | None = None


class Check(BaseModel):
    id: str
    status: Literal["triggered", "clear", "not_applicable"]
    title: str


class AnalyzePaymentResponse(BaseModel):
    outcome: OutcomeValue
    outcome_label: str
    summary: str
    explanation: str
    warning_signs: list[WarningSign]
    recommended_actions: list[str]
    checks: list[Check]
    status_labels: dict[str, str]
    extracted: ExtractedInfo
    insufficient_reasons: list[str]
    disclaimer: str
    language: Language
    engine_version: str
    ai_overrode_engine: bool


class SuggestedTopic(BaseModel):
    topic_id: str
    title: str


class AskRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    language: Language = "en"
    topic_id: str | None = Field(
        None, max_length=64, description="Optional direct topic selection (chips)."
    )
    context: str | None = Field(
        None, max_length=4000, description="Optional previous analysis or conversation context for follow-up questions."
    )

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("text must not be empty")
        return cleaned


class AskResponse(BaseModel):
    topic_id: str
    question: str
    title: str
    answer: str
    suggested: list[SuggestedTopic]
    language: Language
    answered_by: Literal["knowledge_base", "ml_message_analysis", "contextual_followup", "gemini_ai"] = "knowledge_base"


class SpeechToTextResponse(BaseModel):
    status: Literal["ok", "unavailable"]
    transcript: str = ""
    detected_language: str | None = None
    engine: str | None = None
    error_code: str | None = None
    message: str | None = None
    typed_fallback: bool = True


SUPPORTED_TTS_LANGUAGES = {
    "en", "hi", "kn", "bn", "gu", "ml", "mr", "od", "or", "pa", "ta", "te",
    "en-in", "hi-in", "kn-in", "bn-in", "gu-in", "ml-in", "mr-in", "od-in", "or-in", "pa-in", "ta-in", "te-in",
}


class TextToSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000)
    language: str = "en"

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("text must not be empty")
        return cleaned

    @field_validator("language")
    @classmethod
    def validate_language(cls, value: str) -> str:
        clean = value.strip().lower()
        if clean not in SUPPORTED_TTS_LANGUAGES:
            raise ValueError(
                f"language must be one of the 11 supported Bulbul v3 languages: en, hi, kn, bn, gu, ml, mr, od, pa, ta, te"
            )
        return clean


class TextToSpeechResponse(BaseModel):
    status: Literal["ok", "unavailable"]
    audio_base64: str | None = None
    content_type: str | None = None
    engine: str | None = None
    error_code: str | None = None
    message: str | None = None
    fallback: Literal["browser_voice"] | None = None


class VoiceConfigResponse(BaseModel):
    stt_configured: bool
    tts_configured: bool
    stt_model: str
    tts_model: str


class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    engine_version: str
    voice: VoiceConfigResponse


class ErrorResponse(BaseModel):
    detail: str


class EvidenceItem(BaseModel):
    subtype: str
    title: str
    snippet: str
    explanation: str


class AnalyzeMessageRequest(BaseModel):
    """Input for analyzing text messages, SMS, or chat forwards for fraud."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=5000,
        description="Full SMS, WhatsApp or communication text to analyze.",
    )
    language: Language = "en"

    @field_validator("message")
    @classmethod
    def strip_message(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("message must not be empty")
        return cleaned


class AnalyzeMessageResponse(BaseModel):
    """Calibrated multi-class classification and safety synthesis for a message."""

    category: Literal["legitimate", "promotional", "scam", "unsupported", "unknown"]
    risk_level: Literal["low", "medium", "high", "unknown"]
    confidence: float
    class_probabilities: dict[str, float]
    subcategories: list[str]
    is_out_of_distribution: bool
    evidence: list[EvidenceItem]
    safe_next_steps: list[str]
    explanation: str
    model_version: str
    safety_engine_override: bool


class ScamRoleplayRequest(BaseModel):
    scenario: Literal["fake_bank", "lottery_email", "grandchild_emergency"] = "fake_bank"
    user_message: str = Field(..., min_length=1, max_length=1000)
    history: list[dict[str, str]] = Field(default_factory=list)
    language: str = "en"


class ScamRoleplayResponse(BaseModel):
    reply: str
    is_lesson: bool = False
    hint: str | None = None
    success: bool = False
    audio_base64: str | None = None


class JargonRequest(BaseModel):
    term: str = Field(..., min_length=1, max_length=100)
    language: str = "en"


class JargonResponse(BaseModel):
    term: str
    explanation: str
    keep_private: bool = False


class EmergencyRescueRequest(BaseModel):
    description: str = Field(default="", max_length=2000)
    amount_lost: float = 0.0
    upi_id_involved: str = Field(default="", max_length=200)
    language: str = "en"


class RescueStep(BaseModel):
    step: int
    action: str
    detail: str
    link: str | None = None


class EmergencyRescueResponse(BaseModel):
    helpline: str = "1930"
    portal: str = "https://cybercrime.gov.in"
    message: str
    rescue_steps: list[RescueStep]
    complaint_template: str


__all__ = [
    "AnalyzeMessageRequest",
    "AnalyzeMessageResponse",
    "AnalyzePaymentRequest",
    "AnalyzePaymentResponse",
    "AskRequest",
    "AskResponse",
    "Check",
    "EmergencyRescueRequest",
    "EmergencyRescueResponse",
    "ErrorResponse",
    "EvidenceItem",
    "ExtractedInfo",
    "HealthResponse",
    "JargonRequest",
    "JargonResponse",
    "RescueStep",
    "ScamRoleplayRequest",
    "ScamRoleplayResponse",
    "SpeechToTextResponse",
    "SuggestedTopic",
    "TextToSpeechRequest",
    "TextToSpeechResponse",
    "VoiceConfigResponse",
    "WarningSign",
]

