"""Environment-driven configuration for the SAARTHI SafePay backend.

API keys live only here, on the backend. They are never sent to the browser.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173"


def _split_csv(raw: str) -> list[str]:
    return [item.strip() for item in raw.replace(";", ",").split(",") if item.strip()]


@dataclass(frozen=True)
class Settings:
    sarvam_api_key: str | None
    sarvam_stt_url: str
    sarvam_tts_url: str
    stt_model: str
    tts_model: str
    tts_speaker: str | None
    use_edge_tts: bool
    cors_origins: list[str]
    voice_timeout_seconds: float
    max_audio_bytes: int

    @property
    def stt_configured(self) -> bool:
        return self.sarvam_api_key is not None

    @property
    def tts_configured(self) -> bool:
        return (self.sarvam_api_key is not None) or self.use_edge_tts


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Read settings from the environment (cached; call ``get_settings.cache_clear()`` in tests)."""
    key = (os.getenv("SARVAM_API_KEY") or os.getenv("SARVAM_API_TOKEN") or "").strip() or None
    try:
        timeout = float(os.getenv("VOICE_TIMEOUT_SECONDS", "25"))
    except ValueError:
        timeout = 25.0
    try:
        max_mb = int(os.getenv("MAX_AUDIO_MB", "10"))
    except ValueError:
        max_mb = 10
    return Settings(
        sarvam_api_key=key,
        sarvam_stt_url=os.getenv(
            "SARVAM_STT_URL", "https://api.sarvam.ai/speech-to-text"
        ).strip(),
        sarvam_tts_url=os.getenv(
            "SARVAM_TTS_URL", "https://api.sarvam.ai/text-to-speech"
        ).strip(),
        stt_model=os.getenv("SARVAM_STT_MODEL", "saaras:v4").strip(),
        tts_model=os.getenv("SARVAM_TTS_MODEL", "bulbul:v3").strip(),
        tts_speaker=(os.getenv("SARVAM_TTS_SPEAKER", "") or "").strip() or None,
        use_edge_tts=os.getenv("USE_EDGE_TTS", "true").strip().lower() in ("1", "true", "yes"),
        cors_origins=_split_csv(os.getenv("CORS_ORIGINS", DEFAULT_ORIGINS)),
        voice_timeout_seconds=timeout,
        max_audio_bytes=max_mb * 1024 * 1024,
    )
