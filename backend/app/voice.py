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

import asyncio
import base64
import logging
import re
from typing import Any

import edge_tts
import httpx

from .config import Settings, get_settings

logger = logging.getLogger("saarthi.voice")

# Bulbul v3 supported languages (11 languages) mapped to BCP-47 codes
BULBUL_V3_LANGUAGES: dict[str, str] = {
    "en": "en-IN",
    "en-in": "en-IN",
    "hi": "hi-IN",
    "hi-in": "hi-IN",
    "kn": "kn-IN",
    "kn-in": "kn-IN",
    "bn": "bn-IN",
    "bn-in": "bn-IN",
    "gu": "gu-IN",
    "gu-in": "gu-IN",
    "ml": "ml-IN",
    "ml-in": "ml-IN",
    "mr": "mr-IN",
    "mr-in": "mr-IN",
    "od": "od-IN",
    "od-in": "od-IN",
    "or": "od-IN",
    "or-in": "od-IN",
    "pa": "pa-IN",
    "pa-in": "pa-IN",
    "ta": "ta-IN",
    "ta-in": "ta-IN",
    "te": "te-IN",
    "te-in": "te-IN",
}

# Saaras v4 supported input languages (22 scheduled Indian languages + English, plus auto and codemix)
SAARAS_V4_LANGUAGES: dict[str, str] = {
    **BULBUL_V3_LANGUAGES,
    "as": "as-IN",
    "as-in": "as-IN",
    "doi": "doi-IN",
    "doi-in": "doi-IN",
    "kok": "kok-IN",
    "kok-in": "kok-IN",
    "ks": "ks-IN",
    "ks-in": "ks-IN",
    "mai": "mai-IN",
    "mai-in": "mai-IN",
    "mni": "mni-IN",
    "mni-in": "mni-IN",
    "ne": "ne-IN",
    "ne-in": "ne-IN",
    "sa": "sa-IN",
    "sa-in": "sa-IN",
    "sat": "sat-IN",
    "sat-in": "sat-IN",
    "sd": "sd-IN",
    "sd-in": "sd-IN",
    "ur": "ur-IN",
    "ur-in": "ur-IN",
}

# High-fidelity Microsoft Neural TTS fallback voices for all 11 languages
NEURAL_VOICES: dict[str, str] = {
    "en": "en-IN-NeerjaNeural",
    "en-in": "en-IN-NeerjaNeural",
    "hi": "hi-IN-SwaraNeural",
    "hi-in": "hi-IN-SwaraNeural",
    "kn": "kn-IN-GaganNeural",
    "kn-in": "kn-IN-GaganNeural",
    "bn": "bn-IN-TanishaaNeural",
    "bn-in": "bn-IN-TanishaaNeural",
    "gu": "gu-IN-DhwaniNeural",
    "gu-in": "gu-IN-DhwaniNeural",
    "ml": "ml-IN-SobhanaNeural",
    "ml-in": "ml-IN-SobhanaNeural",
    "mr": "mr-IN-AarohiNeural",
    "mr-in": "mr-IN-AarohiNeural",
    "od": "or-IN-SubhasiniNeural",
    "od-in": "or-IN-SubhasiniNeural",
    "or": "or-IN-SubhasiniNeural",
    "or-in": "or-IN-SubhasiniNeural",
    "pa": "pa-IN-GurpreetNeural",
    "pa-in": "pa-IN-GurpreetNeural",
    "ta": "ta-IN-PallaviNeural",
    "ta-in": "ta-IN-PallaviNeural",
    "te": "te-IN-MohanNeural",
    "te-in": "te-IN-MohanNeural",
}

# bulbul:v3 rejects numbers longer than 4 digits unless they use commas.
_LONG_NUMBER_RE = re.compile(r"(?<![\d,.])\d{5,}(?![\d,.])")

# bulbul:v3 limit is 2500 characters per request.
MAX_TTS_CHARS = 2400


def _format_numbers(text: str) -> str:
    def _comma(match: re.Match[str]) -> str:
        return f"{int(match.group(0)):,}"

    return _LONG_NUMBER_RE.sub(_comma, text)


def normalize_tts_language(language: str) -> str | None:
    """Normalize input language code to Bulbul v3 BCP-47 code or None if unsupported."""
    clean = language.strip().lower()
    return BULBUL_V3_LANGUAGES.get(clean)


def normalize_stt_language(language: str) -> str | None:
    """Normalize input language code to Saaras v4 BCP-47 code or None if auto/unsupported."""
    clean = language.strip().lower()
    if clean in ("auto", "unknown", "codemix"):
        return None
    return SAARAS_V4_LANGUAGES.get(clean)


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

            target_lang = BULBUL_V3_LANGUAGES.get(language.strip().lower(), "en-IN")

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
                "typed_fallback": True,
            }
        if len(audio) > settings.max_audio_bytes:
            return {
                "status": "unavailable",
                "error_code": "audio_too_large",
                "message": "The recording is too long. Please keep it under 30 seconds.",
                "typed_fallback": True,
            }

        clean_lang = language.strip().lower()
        # Verify language is recognized if not auto/codemix
        if clean_lang not in ("auto", "codemix") and clean_lang not in SAARAS_V4_LANGUAGES:
            return {
                "status": "unavailable",
                "error_code": "unsupported_language",
                "message": (
                    f"Language '{language}' is not supported by Sarvam Saaras v4. "
                    "Supported languages: 22 scheduled Indian languages, English, auto, or codemix."
                ),
                "typed_fallback": True,
            }

        # 1. Primary: Sarvam AI Saaras v4
        if settings.sarvam_api_key:
            mode = "codemix" if clean_lang == "codemix" else "transcribe"
            data: dict[str, str] = {
                "model": settings.stt_model,
                "mode": mode,
            }
            target_code = normalize_stt_language(clean_lang)
            if target_code:
                data["language_code"] = target_code

            files = {
                "file": (
                    filename or "recording.webm",
                    audio,
                    content_type or "audio/webm",
                )
            }

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
                            "detected_language": payload.get("language_code") or target_code,
                            "engine": settings.stt_model,
                        }
                    return {
                        "status": "unavailable",
                        "error_code": "empty_transcript",
                        "message": "We could not hear anything clearly. Please try again or type your question.",
                        "typed_fallback": True,
                    }

                if response.status_code in (401, 403):
                    logger.error("Sarvam STT authentication failed (status %d)", response.status_code)
                    return {
                        "status": "unavailable",
                        "error_code": "auth_error",
                        "message": "Sarvam AI authentication failed. Please verify SARVAM_API_KEY in backend/.env.",
                        "typed_fallback": True,
                    }

                if response.status_code == 429:
                    logger.warning("Sarvam STT rate limited (status 429)")
                    return {
                        "status": "unavailable",
                        "error_code": "rate_limited",
                        "message": "Sarvam AI rate limit exceeded. Please wait a moment before trying again.",
                        "typed_fallback": True,
                    }

                if response.status_code in (400, 422):
                    detail = ""
                    try:
                        detail = str(response.json().get("detail") or "")
                    except Exception:
                        pass
                    logger.warning("Sarvam STT invalid audio/request (status %d): %s", response.status_code, detail)
                    return {
                        "status": "unavailable",
                        "error_code": "invalid_audio",
                        "message": f"Sarvam AI could not process the audio: {detail or 'invalid format'}",
                        "typed_fallback": True,
                    }

                logger.warning("Sarvam STT upstream error status %d", response.status_code)

            except httpx.TimeoutException:
                logger.warning("Sarvam STT request timed out")
                return {
                    "status": "unavailable",
                    "error_code": "timeout",
                    "message": "Sarvam AI voice recognition timed out. Please try again or type your question.",
                    "typed_fallback": True,
                }
            except httpx.RequestError as exc:
                logger.warning("Sarvam STT connection error: %s", exc)

        # 2. Fallback: Google Speech Recognition if enabled
        if settings.use_google_stt:
            google_text = await self._transcribe_google(audio, clean_lang)
            if google_text:
                return {
                    "status": "ok",
                    "transcript": google_text,
                    "detected_language": clean_lang,
                    "engine": "google-stt",
                }

        if not settings.sarvam_api_key:
            return {
                "status": "unavailable",
                "error_code": "missing_api_key",
                "message": (
                    "Speech-to-text is not configured. Set SARVAM_API_KEY in backend/.env, "
                    "or type your question instead."
                ),
                "typed_fallback": True,
            }

        return {
            "status": "unavailable",
            "error_code": "provider_error",
            "message": "Voice service is temporarily unavailable. Please type your question.",
            "typed_fallback": True,
        }

    # --- text-to-speech -----------------------------------------------------

    async def _synthesize_edge_tts(self, text: str, language: str) -> dict[str, Any]:
        """Synthesize natural speech using high-fidelity Microsoft Neural voices."""
        clean_lang = language.strip().lower()
        voice = NEURAL_VOICES.get(clean_lang, "en-IN-NeerjaNeural")
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

            async def _collect() -> bytes:
                data = b""
                async for chunk in communicate.stream():
                    if chunk["type"] == "audio":
                        data += chunk["data"]
                return data

            timeout_sec = float(self.settings.voice_timeout_seconds or 5.0)
            audio_data = await asyncio.wait_for(_collect(), timeout=timeout_sec)

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
        except asyncio.TimeoutError:
            logger.warning("Neural speech synthesis timed out")
            return {
                "status": "unavailable",
                "error_code": "timeout",
                "message": "Neural TTS timed out.",
                "fallback": "browser_voice",
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

        clean_text = text.strip()
        if not clean_text:
            return {
                "status": "unavailable",
                "error_code": "empty_text",
                "message": "No text provided for speech synthesis.",
                "fallback": "browser_voice",
            }

        target_bcp47 = normalize_tts_language(language)
        if not target_bcp47:
            valid_langs = ", ".join(sorted(set(BULBUL_V3_LANGUAGES.keys())))
            return {
                "status": "unavailable",
                "error_code": "unsupported_language",
                "message": (
                    f"Language '{language}' is not supported by Sarvam Bulbul v3. "
                    f"Supported languages: {valid_langs}."
                ),
                "fallback": "browser_voice",
            }

        # 1. Primary: Sarvam AI Bulbul v3
        if settings.sarvam_api_key:
            body: dict[str, Any] = {
                "text": _format_numbers(clean_text[:MAX_TTS_CHARS]),
                "language_code": target_bcp47,
                "model": settings.tts_model,
                "speaker": settings.tts_speaker or "shubh",
                "pace": 1.0,
                "speech_sample_rate": 22050,
                "enable_preprocessing": True,
            }

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

                if response.status_code in (401, 403):
                    logger.error("Sarvam TTS authentication failed (status %d)", response.status_code)
                    return {
                        "status": "unavailable",
                        "error_code": "auth_error",
                        "message": "Sarvam AI authentication failed. Please verify SARVAM_API_KEY in backend/.env.",
                        "fallback": "browser_voice",
                    }

                if response.status_code == 429:
                    logger.warning("Sarvam TTS rate limited (status 429)")
                    # Fall back to Edge TTS if enabled
                    if settings.use_edge_tts:
                        edge_res = await self._synthesize_edge_tts(clean_text, language)
                        if edge_res.get("status") == "ok":
                            return edge_res
                    return {
                        "status": "unavailable",
                        "error_code": "rate_limited",
                        "message": "Sarvam AI rate limit exceeded.",
                        "fallback": "browser_voice",
                    }

                if response.status_code in (400, 422):
                    detail = ""
                    try:
                        detail = str(response.json().get("detail") or "")
                    except Exception:
                        pass
                    logger.warning("Sarvam TTS bad request (status %d): %s", response.status_code, detail)
                    return {
                        "status": "unavailable",
                        "error_code": "invalid_request",
                        "message": f"Sarvam AI TTS request rejected: {detail or 'invalid input'}",
                        "fallback": "browser_voice",
                    }

                logger.warning("Sarvam TTS failed with status %d", response.status_code)

            except httpx.TimeoutException:
                logger.warning("Sarvam TTS timed out")
                if settings.use_edge_tts:
                    edge_res = await self._synthesize_edge_tts(clean_text, language)
                    if edge_res.get("status") == "ok":
                        return edge_res
                return {
                    "status": "unavailable",
                    "error_code": "timeout",
                    "message": "Sarvam TTS request timed out.",
                    "fallback": "browser_voice",
                }
            except httpx.RequestError as exc:
                logger.warning("Sarvam TTS network error: %s", exc)

        # 2. Secondary fallback: High-quality Neural Edge TTS
        if settings.use_edge_tts:
            edge_result = await self._synthesize_edge_tts(clean_text, language)
            if edge_result.get("status") == "ok":
                return edge_result

        # 3. Honest fallback to browser voice
        if not settings.sarvam_api_key:
            return {
                "status": "unavailable",
                "error_code": "missing_api_key",
                "message": "Voice output is not configured. Set SARVAM_API_KEY in backend/.env.",
                "fallback": "browser_voice",
            }

        return {
            "status": "unavailable",
            "error_code": "provider_error",
            "message": "Voice synthesis temporarily unavailable.",
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
