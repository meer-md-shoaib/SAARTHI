"""Pydantic request/response models for the SAARTHI SafePay API."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

Language = Literal["en", "hi", "kn"]
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
    text: str = Field(..., min_length=1, max_length=500)
    language: Language = "en"
    topic_id: str | None = Field(
        None, max_length=64, description="Optional direct topic selection (chips)."
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
    answered_by: Literal["knowledge_base"]


class SpeechToTextResponse(BaseModel):
    status: Literal["ok", "unavailable"]
    transcript: str = ""
    detected_language: str | None = None
    engine: str | None = None
    error_code: str | None = None
    message: str | None = None
    typed_fallback: bool = True


class TextToSpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10_000)
    language: Language = "en"

    @field_validator("text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("text must not be empty")
        return cleaned


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


__all__ = [
    "AnalyzePaymentRequest",
    "AnalyzePaymentResponse",
    "AskRequest",
    "AskResponse",
    "Check",
    "ExtractedInfo",
    "HealthResponse",
    "SpeechToTextResponse",
    "SuggestedTopic",
    "TextToSpeechRequest",
    "TextToSpeechResponse",
    "VoiceConfigResponse",
    "WarningSign",
    "ErrorResponse",
]
