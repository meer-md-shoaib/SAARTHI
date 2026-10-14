"""API-level tests (FastAPI TestClient): validation, fallbacks, no fake data."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app

CLEAN_QR = (
    "upi://pay?pa=green.kiran@okhdfcbank&pn=Green%20Kiran%20Stores"
    "&am=250&cu=INR&tn=Kirana%20groceries"
)


@pytest.fixture()
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "saarthi-safepay"
    assert body["engine_version"]
    assert "stt_configured" in body["voice"]
    assert body["voice"]["stt_model"] == "saaras:v4"
    assert body["voice"]["tts_model"] == "bulbul:v3"


def test_analyze_payment_low_concern(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze-payment",
        json={
            "raw_text": CLEAN_QR,
            "intention": "pay",
            "expected_amount": 250,
            "language": "en",
            "source": "demo",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["outcome"] == "low_concern"
    assert body["warning_signs"] == []
    assert len(body["checks"]) == 9
    assert body["ai_overrode_engine"] is False
    assert body["disclaimer"]


def test_analyze_payment_hindi(client: TestClient) -> None:
    response = client.post(
        "/api/v1/analyze-payment",
        json={"raw_text": CLEAN_QR, "intention": "pay", "language": "hi"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["language"] == "hi"
    assert body["outcome_label"] == "कम चिंता"


@pytest.mark.parametrize(
    "payload",
    [
        {"raw_text": ""},
        {"intention": "pay"},
        {"raw_text": "x", "language": "fr"},
        {"raw_text": "x", "intention": "transfer"},
        {"raw_text": "x", "expected_amount": -5},
    ],
)
def test_analyze_payment_validation(client: TestClient, payload: dict) -> None:
    response = client.post("/api/v1/analyze-payment", json=payload)
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert isinstance(detail, str) and detail  # plain-language error, not a stack trace


def test_ask_matches_topic(client: TestClient) -> None:
    response = client.post(
        "/api/v1/ask", json={"text": "Should I share my OTP?", "language": "en"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["topic_id"] == "otp"
    assert "Never share it" in body["answer"]
    assert body["answered_by"] == "knowledge_base"
    assert body["suggested"]


def test_ask_hindi_and_fallback(client: TestClient) -> None:
    hindi = client.post("/api/v1/ask", json={"text": "ओटीपी क्या है", "language": "hi"})
    assert hindi.status_code == 200
    assert hindi.json()["topic_id"] == "otp"

    fallback = client.post("/api/v1/ask", json={"text": "zzzz unknown thing", "language": "en"})
    assert fallback.status_code == 200
    assert fallback.json()["topic_id"] == "fallback"

    chip = client.post(
        "/api/v1/ask",
        json={"text": "tell me", "language": "en", "topic_id": "qr_check"},
    )
    assert chip.json()["topic_id"] == "qr_check"


def test_speech_to_text_reports_fallback_without_key(monkeypatch) -> None:
    monkeypatch.delenv("SARVAM_API_KEY", raising=False)
    get_settings.cache_clear()
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/speech-to-text",
                files={"file": ("recording.webm", b"not-really-audio", "audio/webm")},
                data={"language": "en"},
            )
            assert response.status_code == 200
            body = response.json()
            assert body["status"] == "unavailable"
            assert body["error_code"] == "missing_api_key"
            assert body["transcript"] == ""  # never invents text
            assert body["typed_fallback"] is True
    finally:
        get_settings.cache_clear()


def test_text_to_speech_reports_fallback_without_key(monkeypatch) -> None:
    monkeypatch.delenv("SARVAM_API_KEY", raising=False)
    get_settings.cache_clear()
    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/text-to-speech", json={"text": "Be careful.", "language": "en"}
            )
            assert response.status_code == 200
            body = response.json()
            assert body["status"] == "unavailable"
            assert body["audio_base64"] is None  # never returns fake audio
            assert body["fallback"] == "browser_voice"
    finally:
        get_settings.cache_clear()


def test_voice_input_validation(client: TestClient) -> None:
    bad_lang = client.post(
        "/api/v1/speech-to-text",
        files={"file": ("a.webm", b"x", "audio/webm")},
        data={"language": "fr"},
    )
    assert bad_lang.status_code == 422

    empty_tts = client.post("/api/v1/text-to-speech", json={"text": "   "})
    assert empty_tts.status_code == 422

    missing_file = client.post("/api/v1/speech-to-text", data={"language": "en"})
    assert missing_file.status_code == 422


def test_unknown_api_path_returns_json_404(client: TestClient) -> None:
    response = client.get("/api/v1/does-not-exist")
    assert response.status_code == 404
    assert "detail" in response.json()
