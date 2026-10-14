"""Sarvam AI voice services (speech-to-text and text-to-speech).

Contract with the rest of the app:

* Every function returns a structured result. It NEVER invents a transcript or
  audio: when the service or API key is unavailable it reports
  ``status="unavailable"`` with an error code, and the UI falls back to typed
  text (STT) or the browser voice (TTS).
* Audio and text stay between this backend and Sarvam. No banking data, PINs,
  OTPs or passwords are ever sent here - see ``main.analyze`` which only runs
  the deterministic engine.
"""

from __future__ import annotations

import logging
import re
from typing import Any

import httpx

from .config import Settings, get_settings

logger = logging.getLogger("saarthi.voice")

# Sarvam language codes (BCP-47) per app language.
LANGUAGE_CODES: dict[str, str] = {"en": "en-IN", "hi": "hi-IN", "kn": "kn-IN"}

# bulbul:v3 rejects numbers longer than 4 digits unless they use commas.
_LONG_NUMBER_RE = re.compile(r"(?<![\d,.])\d{5,}(?![\d,.])")

# bulbul:v3 limit is 2500 characters per request.
MAX_TTS_CHARS = 2400


def _format_numbers(text: str) -> str:
    def _comma(match: re.Match[str]) -> str:
        return f"{int(match.group(0)):,}"

    return _LONG_NUMBER_RE.sub(_comma, text)


class VoiceService:
    """Thin async wrapper around the Sarvam REST API with safe fallbacks."""

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings
        self._client: httpx.AsyncClient | None = None

    @property
    def settings(self) -> Settings:
        """Current settings (re-read per call so env changes take effect)."""
        if self._settings is not None:
            return self._settings
        return get_settings()

    @property
    def client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(timeout=self.settings.voice_timeout_seconds)
        return self._client

    async def aclose(self) -> None:
        if self._client is not None and not self._client.is_closed:
            await self._client.aclose()

    # --- speech-to-text -----------------------------------------------------

    async def speech_to_text(
        self,
        audio: bytes,
        filename: str,
        content_type: str | None,
        language: str = "en",
    ) -> dict[str, Any]:
        settings = self.settings
        if not settings.sarvam_api_key:
            return {
                "status": "unavailable",
                "error_code": "missing_api_key",
                "message": (
                    "Speech-to-text is not configured. Set SARVAM_API_KEY on the "
                    "backend, or type your question instead."
                ),
            }
        if not audio:
            return {
                "status": "unavailable",
                "error_code": "empty_audio",
                "message": "No audio was recorded. Please try again or type your question.",
            }
        if len(audio) > settings.max_audio_bytes:
            return {
                "status": "unavailable",
                "error_code": "audio_too_large",
                "message": "The recording is too long. Please keep it under 30 seconds.",
            }

        data = {"model": settings.stt_model, "mode": "transcribe"}
        files = {"file": (filename or "audio.webm", audio, content_type or "application/octet-stream")}
        try:
            response = await self.client.post(
                settings.sarvam_stt_url,
                data=data,
                files=files,
                headers={"api-subscription-key": settings.sarvam_api_key},
            )
        except httpx.TimeoutException:
            return {
                "status": "unavailable",
                "error_code": "timeout",
                "message": "The speech service took too long. Please type your question instead.",
            }
        except httpx.HTTPError as exc:
            logger.warning("speech-to-text transport error: %s", exc)
            return {
                "status": "unavailable",
                "error_code": "network_error",
                "message": "Could not reach the speech service. Please type your question instead.",
            }

        if response.status_code != 200:
            logger.warning(
                "speech-to-text failed with status %s: %s", response.status_code, response.text[:500]
            )
            return {
                "status": "unavailable",
                "error_code": f"upstream_{response.status_code}",
                "message": "The speech service could not read that recording. Please type instead.",
            }

        try:
            payload = response.json()
        except ValueError:
            return {
                "status": "unavailable",
                "error_code": "bad_response",
                "message": "The speech service returned an unreadable response. Please type instead.",
            }

        transcript = (payload.get("transcript") or "").strip()
        if not transcript:
            return {
                "status": "unavailable",
                "error_code": "empty_transcript",
                "message": (
                    "We could not hear anything clearly. Please try again or "
                    "type your question."
                ),
            }
        return {
            "status": "ok",
            "transcript": transcript,
            "detected_language": payload.get("language_code"),
            "engine": settings.stt_model,
        }

    # --- text-to-speech -----------------------------------------------------

    async def text_to_speech(self, text: str, language: str = "en") -> dict[str, Any]:
        settings = self.settings
        if not settings.sarvam_api_key:
            return {
                "status": "unavailable",
                "error_code": "missing_api_key",
                "message": "Voice output is not configured. Set SARVAM_API_KEY on the backend.",
                "fallback": "browser_voice",
            }

        body: dict[str, Any] = {
            "text": _format_numbers(text[:MAX_TTS_CHARS]),
            "language_code": LANGUAGE_CODES.get(language, "en-IN"),
            "model": settings.tts_model,
        }
        if settings.tts_speaker:
            body["speaker"] = settings.tts_speaker

        try:
            response = await self.client.post(
                settings.sarvam_tts_url,
                json=body,
                headers={"api-subscription-key": settings.sarvam_api_key},
            )
        except httpx.TimeoutException:
            return {
                "status": "unavailable",
                "error_code": "timeout",
                "message": "The voice service took too long.",
                "fallback": "browser_voice",
            }
        except httpx.HTTPError as exc:
            logger.warning("text-to-speech transport error: %s", exc)
            return {
                "status": "unavailable",
                "error_code": "network_error",
                "message": "Could not reach the voice service.",
                "fallback": "browser_voice",
            }

        if response.status_code != 200:
            logger.warning(
                "text-to-speech failed with status %s: %s", response.status_code, response.text[:500]
            )
            return {
                "status": "unavailable",
                "error_code": f"upstream_{response.status_code}",
                "message": "The voice service could not speak this text right now.",
                "fallback": "browser_voice",
            }

        try:
            payload = response.json()
        except ValueError:
            return {
                "status": "unavailable",
                "error_code": "bad_response",
                "message": "The voice service returned an unreadable response.",
                "fallback": "browser_voice",
            }

        audios = payload.get("audios") or []
        if not audios or not audios[0]:
            return {
                "status": "unavailable",
                "error_code": "empty_audio",
                "message": "The voice service returned no audio.",
                "fallback": "browser_voice",
            }
        return {
            "status": "ok",
            "audio_base64": audios[0],
            "content_type": "audio/wav",
            "engine": settings.tts_model,
        }


_service: VoiceService | None = None


def get_voice_service() -> VoiceService:
    global _service
    if _service is None:
        _service = VoiceService()
    return _service


async def close_voice_service() -> None:
    global _service
    if _service is not None:
        await _service.aclose()
        _service = None
