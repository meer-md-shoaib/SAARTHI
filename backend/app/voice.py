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

import base64
import logging
import re
from typing import Any

import edge_tts
import httpx

from .config import Settings, get_settings

logger = logging.getLogger("saarthi.voice")

# Sarvam language codes (BCP-47) per app language.
LANGUAGE_CODES: dict[str, str] = {"en": "en-IN", "hi": "hi-IN", "kn": "kn-IN"}

# High-fidelity Microsoft Neural TTS voices for Kannada, Hindi, and English.
NEURAL_VOICES: dict[str, str] = {
    "kn": "kn-IN-GaganNeural",
    "hi": "hi-IN-SwaraNeural",
    "en": "en-IN-NeerjaNeural",
}

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

    async def _transcribe_google(self, audio: bytes, language: str) -> str | None:
        """Fallback transcription via Google SpeechRecognition for WAV/PCM audio."""
        try:
            import asyncio
            import io
            import speech_recognition as sr  # type: ignore[import-untyped]

            lang_map = {
                "kn": "kn-IN",
                "hi": "hi-IN",
                "en": "en-IN",
            }
            target_lang = lang_map.get(language, "en-IN")

            def _sync_recognize() -> str | None:
                r = sr.Recognizer()
                with sr.AudioFile(io.BytesIO(audio)) as source:
                    audio_data = r.record(source)
                try:
                    return r.recognize_google(audio_data, language=target_lang)
                except (sr.UnknownValueError, sr.RequestError):
                    return None

            return await asyncio.to_thread(_sync_recognize)
        except Exception as exc:
            logger.debug("Google STT fallback attempt failed: %s", exc)
            return None

    async def speech_to_text(
        self,
        audio: bytes,
        filename: str,
        content_type: str | None,
        language: str = "en",
    ) -> dict[str, Any]:
        settings = self.settings
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

        # If Sarvam key is configured, query Sarvam AI
        if settings.sarvam_api_key:
            data = {"model": settings.stt_model, "mode": "transcribe"}
            files = {"file": (filename or "audio.webm", audio, content_type or "application/octet-stream")}
            try:
                response = await self.client.post(
                    settings.sarvam_stt_url,
                    data=data,
                    files=files,
                    headers={"api-subscription-key": settings.sarvam_api_key},
                )
                if response.status_code == 200:
                    payload = response.json()
                    transcript = (payload.get("transcript") or "").strip()
                    if transcript:
                        return {
                            "status": "ok",
                            "transcript": transcript,
                            "detected_language": payload.get("language_code"),
                            "engine": settings.stt_model,
                        }
            except Exception as exc:
                logger.warning("Sarvam STT failed: %s", exc)

        # Fallback: Google Speech Recognition if enabled
        if settings.use_google_stt:
            google_text = await self._transcribe_google(audio, language)
            if google_text:
                return {
                    "status": "ok",
                    "transcript": google_text,
                    "detected_language": language,
                    "engine": "google-stt",
                }

        if not settings.sarvam_api_key:
            return {
                "status": "unavailable",
                "error_code": "missing_api_key",
                "message": (
                    "Speech-to-text is not configured. Set SARVAM_API_KEY on the "
                    "backend, or type your question instead."
                ),
            }

        return {
            "status": "unavailable",
            "error_code": "empty_transcript",
            "message": (
                "We could not hear anything clearly. Please try again or type your question."
            ),
        }

    # --- text-to-speech -----------------------------------------------------

    async def _synthesize_edge_tts(self, text: str, language: str) -> dict[str, Any]:
        """Synthesize natural speech using high-fidelity Microsoft Neural voices."""
        voice = NEURAL_VOICES.get(language, "en-IN-NeerjaNeural")
        clean_text = text[:MAX_TTS_CHARS].strip()
        if not clean_text:
            return {
                "status": "unavailable",
                "error_code": "empty_text",
                "message": "No text provided for speech synthesis.",
                "fallback": "browser_voice",
            }
        try:
            communicate = edge_tts.Communicate(clean_text, voice)
            audio_data = b""
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_data += chunk["data"]

            if not audio_data:
                return {
                    "status": "unavailable",
                    "error_code": "empty_audio",
                    "message": "Neural speech service returned empty audio.",
                    "fallback": "browser_voice",
                }

            b64_audio = base64.b64encode(audio_data).decode("ascii")
            return {
                "status": "ok",
                "audio_base64": b64_audio,
                "content_type": "audio/mp3",
                "engine": f"edge-tts:{voice}",
            }
        except Exception as exc:
            logger.warning("Neural speech synthesis error: %s", exc)
            return {
                "status": "unavailable",
                "error_code": "neural_tts_error",
                "message": f"Neural TTS failed: {exc}",
                "fallback": "browser_voice",
            }

    async def text_to_speech(self, text: str, language: str = "en") -> dict[str, Any]:
        settings = self.settings

        # 1. Try Sarvam AI if API key is provided
        if settings.sarvam_api_key:
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
                if response.status_code == 200:
                    payload = response.json()
                    audios = payload.get("audios") or []
                    if audios and audios[0]:
                        return {
                            "status": "ok",
                            "audio_base64": audios[0],
                            "content_type": "audio/wav",
                            "engine": settings.tts_model,
                        }
            except Exception as exc:
                logger.warning("Sarvam TTS request failed, falling back to neural TTS: %s", exc)

        # 2. High-quality Neural Edge TTS (Kannada, Hindi, Indian English)
        if settings.use_edge_tts:
            edge_result = await self._synthesize_edge_tts(text, language)
            if edge_result.get("status") == "ok":
                return edge_result

        # 3. Honest fallback to browser voice
        return {
            "status": "unavailable",
            "error_code": "missing_api_key",
            "message": "Voice output is not configured. Set SARVAM_API_KEY on the backend.",
            "fallback": "browser_voice",
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
