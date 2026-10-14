from __future__ import annotations

from unittest.mock import patch

import httpx
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


def test_ask_contextual_followup(client: TestClient) -> None:
    response = client.post(
        "/api/v1/ask",
        json={
            "text": "Why is this suspicious?",
            "language": "en",
            "context": "Payment has high mismatch risk. Amount Rs. 5000 requested.",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["topic_id"] == "contextual_followup"
    assert body["answered_by"] == "contextual_followup"
    assert "Based on your recent safety analysis" in body["answer"]
    assert "Rs. 5000" in body["answer"]


def test_speech_to_text_reports_fallback_without_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SARVAM_API_KEY", raising=False)
    monkeypatch.setenv("USE_GOOGLE_STT", "false")
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


def test_text_to_speech_reports_fallback_without_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("SARVAM_API_KEY", raising=False)
    monkeypatch.setenv("USE_EDGE_TTS", "false")
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


def test_text_to_speech_neural_kannada_and_hindi(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    # Explicitly test Edge-TTS neural fallback path without consuming Sarvam API or hitting network
    monkeypatch.delenv("SARVAM_API_KEY", raising=False)
    monkeypatch.setenv("USE_EDGE_TTS", "true")
    get_settings.cache_clear()

    async def mock_stream(self):
        yield {"type": "audio", "data": b"fake-neural-audio-stream"}

    try:
        with patch("edge_tts.Communicate.stream", mock_stream):
            # Test Kannada neural synthesis
            response_kn = client.post(
                "/api/v1/text-to-speech",
                json={"text": "ನಮಸ್ಕಾರ, ಸುರಕ್ಷಿತವಾಗಿರಿ.", "language": "kn"},
            )
            assert response_kn.status_code == 200
            body_kn = response_kn.json()
            assert body_kn["status"] == "ok"
            assert body_kn["audio_base64"] is not None
            assert body_kn["content_type"] in ("audio/mp3", "audio/wav")
            assert "edge-tts:kn-IN" in body_kn.get("engine", "")

            # Test Hindi neural synthesis
            response_hi = client.post(
                "/api/v1/text-to-speech",
                json={"text": "नमस्ते, सावधान रहें।", "language": "hi"},
            )
            assert response_hi.status_code == 200
            body_hi = response_hi.json()
            assert body_hi["status"] == "ok"
            assert body_hi["audio_base64"] is not None
    finally:
        get_settings.cache_clear()


# --- Sarvam AI Saaras v4 STT Mocked Tests -------------------------------------

def test_sarvam_stt_success_and_headers(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test_mock_sarvam_key")
    get_settings.cache_clear()

    captured_request = {}

    async def mock_post(url, **kwargs):
        captured_request["url"] = str(url)
        captured_request["headers"] = kwargs.get("headers", {})
        captured_request["data"] = kwargs.get("data", {})
        captured_request["files"] = kwargs.get("files", {})
        return httpx.Response(
            200,
            json={"transcript": "ನಮಸ್ಕಾರ, ಸುರಕ್ಷಿತವಾಗಿರಿ.", "language_code": "kn-IN"},
        )

    try:
        with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
            response = client.post(
                "/api/v1/speech-to-text",
                files={"file": ("recording.webm", b"fake-audio-bytes-for-test", "audio/webm")},
                data={"language": "kn"},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["transcript"] == "ನಮಸ್ಕಾರ, ಸುರಕ್ಷಿತವಾಗಿರಿ."
        assert body["detected_language"] == "kn-IN"
        assert body["engine"] == "saaras:v4"

        # Verify Sarvam API contracts
        assert captured_request["url"] == "https://api.sarvam.ai/speech-to-text"
        assert captured_request["headers"]["api-subscription-key"] == "test_mock_sarvam_key"
        assert captured_request["data"]["model"] == "saaras:v4"
        assert captured_request["data"]["mode"] == "transcribe"
        assert captured_request["data"]["language_code"] == "kn-IN"
        assert "file" in captured_request["files"]
    finally:
        get_settings.cache_clear()


def test_sarvam_stt_codemix_and_auto_language(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test_mock_sarvam_key")
    get_settings.cache_clear()

    captured_requests = []

    async def mock_post(url, **kwargs):
        captured_requests.append(kwargs)
        return httpx.Response(
            200,
            json={"transcript": "payment ho gaya", "language_code": "hi-IN"},
        )

    try:
        with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
            # Test codemix mode
            res_codemix = client.post(
                "/api/v1/speech-to-text",
                files={"file": ("recording.webm", b"fake-audio", "audio/webm")},
                data={"language": "codemix"},
            )
            assert res_codemix.status_code == 200
            assert captured_requests[0]["data"]["mode"] == "codemix"
            assert "language_code" not in captured_requests[0]["data"]

            # Test auto mode
            res_auto = client.post(
                "/api/v1/speech-to-text",
                files={"file": ("recording.webm", b"fake-audio", "audio/webm")},
                data={"language": "auto"},
            )
            assert res_auto.status_code == 200
            assert captured_requests[1]["data"]["mode"] == "transcribe"
            assert "language_code" not in captured_requests[1]["data"]
    finally:
        get_settings.cache_clear()


def test_sarvam_stt_auth_failure_401(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "invalid_key")
    get_settings.cache_clear()

    async def mock_post(url, **kwargs):
        return httpx.Response(401, json={"detail": "Invalid API key"})

    try:
        with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
            response = client.post(
                "/api/v1/speech-to-text",
                files={"file": ("rec.webm", b"audio", "audio/webm")},
                data={"language": "en"},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "unavailable"
        assert body["error_code"] == "auth_error"
        assert "authentication failed" in body["message"].lower()
    finally:
        get_settings.cache_clear()


def test_sarvam_stt_rate_limit_429(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test_key")
    get_settings.cache_clear()

    async def mock_post(url, **kwargs):
        return httpx.Response(429, json={"detail": "Too many requests"})

    try:
        with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
            response = client.post(
                "/api/v1/speech-to-text",
                files={"file": ("rec.webm", b"audio", "audio/webm")},
                data={"language": "en"},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "unavailable"
        assert body["error_code"] == "rate_limited"
    finally:
        get_settings.cache_clear()


def test_sarvam_stt_timeout(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test_key")
    get_settings.cache_clear()

    async def mock_post(url, **kwargs):
        raise httpx.TimeoutException("Read timed out")

    try:
        with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
            response = client.post(
                "/api/v1/speech-to-text",
                files={"file": ("rec.webm", b"audio", "audio/webm")},
                data={"language": "en"},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "unavailable"
        assert body["error_code"] == "timeout"
    finally:
        get_settings.cache_clear()


# --- Sarvam AI Bulbul v3 TTS Mocked Tests -------------------------------------

def test_sarvam_tts_success_and_payload(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "test_mock_sarvam_key")
    get_settings.cache_clear()

    captured_request = {}

    async def mock_post(url, **kwargs):
        captured_request["url"] = str(url)
        captured_request["headers"] = kwargs.get("headers", {})
        captured_request["json"] = kwargs.get("json", {})
        return httpx.Response(
            200,
            json={"audios": ["UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="]},
        )

    try:
        with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
            response = client.post(
                "/api/v1/text-to-speech",
                json={"text": "Pay 15000 rupees to store", "language": "hi"},
            )

        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["audio_base64"] == "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="
        assert body["content_type"] == "audio/wav"
        assert body["engine"] == "bulbul:v3"

        # Verify Sarvam Bulbul v3 API payload requirements
        assert captured_request["url"] == "https://api.sarvam.ai/text-to-speech"
        assert captured_request["headers"]["api-subscription-key"] == "test_mock_sarvam_key"
        payload = captured_request["json"]
        assert payload["model"] == "bulbul:v3"
        assert payload["speaker"] == "shubh"
        assert payload["language_code"] == "hi-IN"
        assert payload["pace"] == 1.0
        assert payload["speech_sample_rate"] == 22050
        assert payload["enable_preprocessing"] is True
        # Numbers > 4 digits must be comma-formatted for bulbul:v3
        assert "15,000" in payload["text"]
    finally:
        get_settings.cache_clear()


def test_sarvam_tts_all_11_languages(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    """Verify that all 11 languages supported by Bulbul v3 map to valid BCP-47 codes."""
    monkeypatch.setenv("SARVAM_API_KEY", "test_mock_sarvam_key")
    get_settings.cache_clear()

    # The 11 languages for Bulbul v3 and their expected BCP-47 codes
    languages_to_test = [
        ("en", "en-IN"),
        ("hi", "hi-IN"),
        ("kn", "kn-IN"),
        ("bn", "bn-IN"),
        ("gu", "gu-IN"),
        ("ml", "ml-IN"),
        ("mr", "mr-IN"),
        ("od", "od-IN"),
        ("pa", "pa-IN"),
        ("ta", "ta-IN"),
        ("te", "te-IN"),
    ]

    captured_lang_codes = []

    async def mock_post(url, **kwargs):
        captured_lang_codes.append(kwargs.get("json", {}).get("language_code"))
        return httpx.Response(
            200,
            json={"audios": ["dGVzdGF1ZGlv"]},
        )

    try:
        with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
            for lang_short, expected_bcp47 in languages_to_test:
                res = client.post(
                    "/api/v1/text-to-speech",
                    json={"text": "Test greeting", "language": lang_short},
                )
                assert res.status_code == 200
                assert res.json()["status"] == "ok"

        assert captured_lang_codes == [expected for _, expected in languages_to_test]
    finally:
        get_settings.cache_clear()


def test_sarvam_tts_auth_failure_401(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    monkeypatch.setenv("SARVAM_API_KEY", "invalid_key")
    get_settings.cache_clear()

    async def mock_post(url, **kwargs):
        return httpx.Response(401, json={"detail": "Unauthorized"})

    try:
        with patch.object(httpx.AsyncClient, "post", side_effect=mock_post):
            response = client.post(
                "/api/v1/text-to-speech",
                json={"text": "Safety alert", "language": "en"},
            )
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "unavailable"
        assert body["error_code"] == "auth_error"
        assert body["fallback"] == "browser_voice"
    finally:
        get_settings.cache_clear()


def test_voice_input_validation(client: TestClient) -> None:
    # Unsupported language for STT
    bad_lang = client.post(
        "/api/v1/speech-to-text",
        files={"file": ("a.webm", b"x", "audio/webm")},
        data={"language": "fr"},
    )
    assert bad_lang.status_code == 422

    # Unsupported language for TTS
    bad_tts_lang = client.post(
        "/api/v1/text-to-speech",
        json={"text": "Bonjour", "language": "fr"},
    )
    assert bad_tts_lang.status_code == 422

    # Empty text for TTS
    empty_tts = client.post("/api/v1/text-to-speech", json={"text": "   "})
    assert empty_tts.status_code == 422

    # Missing file for STT
    missing_file = client.post("/api/v1/speech-to-text", data={"language": "en"})
    assert missing_file.status_code == 422


def test_unknown_api_path_returns_json_404(client: TestClient) -> None:
    response = client.get("/api/v1/does-not-exist")
    assert response.status_code == 404
    assert "detail" in response.json()


def test_gemini_stt_transcription(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "test_gemini_key")
    get_settings.cache_clear()

    async def mock_transcribe(audio_bytes, mime_type="audio/webm", language="en"):
        return "Can I share my OTP with a bank manager?"

    with patch("app.gemini.GeminiService.transcribe_audio", side_effect=mock_transcribe):
        response = client.post(
            "/api/v1/speech-to-text",
            files={"file": ("recording.webm", b"fake-audio-bytes", "audio/webm")},
            data={"language": "en"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "ok"
        assert body["transcript"] == "Can I share my OTP with a bank manager?"
        assert "gemini" in body["engine"]


def test_gemini_ask_qa(monkeypatch: pytest.MonkeyPatch, client: TestClient) -> None:
    monkeypatch.setenv("GEMINI_API_KEY", "test_gemini_key")
    get_settings.cache_clear()

    async def mock_answer(question, language="en", context=None):
        return "Never share your OTP or UPI PIN with anyone, even if they claim to be from a bank."

    with patch("app.gemini.GeminiService.answer_safety_question", side_effect=mock_answer):
        response = client.post(
            "/api/v1/ask",
            json={"text": "Should I share OTP with bank?", "language": "en"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["answered_by"] == "gemini_ai"
        assert "Never share your OTP" in body["answer"]


def test_non_upi_message_thinking_analysis(
    monkeypatch: pytest.MonkeyPatch, client: TestClient
) -> None:
    # Verify that a random electricity threat message is NOT rejected as "invalid VPA"
    response = client.post(
        "/api/v1/analyze-payment",
        json={
            "raw_text": "Dear customer, your electricity will be disconnected tonight at 9:30pm due to unpaid bill. Call officer at 9876543210 immediately.",
            "intention": "unknown",
            "language": "en",
        },
    )
    assert response.status_code == 200
    body = response.json()
    # It must evaluate the threat, not complain about missing UPI QR code
    assert body["outcome"] in ("high_concern", "be_careful")
    assert body["ai_overrode_engine"] is True
    assert len(body["recommended_actions"]) > 0

