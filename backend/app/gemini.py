"""Google Gemini 2.5 Flash service for intelligent speech-to-text, safety Q&A, and scam analysis.

Uses raw httpx async client - no external heavy dependencies required.
"""

from __future__ import annotations

import base64
import json
import logging
from typing import Any

import httpx

from .config import get_settings

logger = logging.getLogger("saarthi.gemini")

GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

LANG_NAMES: dict[str, str] = {
    "en": "English",
    "hi": "Hindi (हिंदी)",
    "kn": "Kannada (ಕನ್ನಡ)",
    "bn": "Bengali (বাংলা)",
    "gu": "Gujarati (ગુજરાતી)",
    "ml": "Malayalam (മലയാളം)",
    "mr": "Marathi (मराठी)",
    "od": "Odia (ଓଡ଼ିଆ)",
    "pa": "Punjabi (ਪੰਜਾਬੀ)",
    "ta": "Tamil (தமிழ்)",
    "te": "Telugu (తెలుగు)",
}


class GeminiService:
    """Async client for Google Gemini 2.5 Flash."""

    def _get_url(self) -> str | None:
        settings = get_settings()
        if not settings.gemini_api_key:
            return None
        model = settings.gemini_model or "gemini-2.5-flash"
        return f"{GEMINI_API_URL}/{model}:generateContent?key={settings.gemini_api_key}"

    async def transcribe_audio(
        self, audio_bytes: bytes, mime_type: str = "audio/webm", language: str = "en"
    ) -> str | None:
        """Transcribe audio with high accuracy using Gemini 2.5 Flash."""
        url = self._get_url()
        if not url or not audio_bytes:
            return None

        clean_mime = mime_type.split(";")[0].strip() or "audio/webm"
        b64_audio = base64.b64encode(audio_bytes).decode("ascii")
        lang_hint = LANG_NAMES.get(language.lower(), "Indian languages or English")

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": (
                                f"Listen to this audio carefully. It may be spoken in {lang_hint} or code-mixed Hinglish/Kannada. "
                                "Transcribe exactly what the user said. Return ONLY the transcribed text with proper punctuation. "
                                "Do NOT include notes, explanations, or quotes."
                            )
                        },
                        {
                            "inline_data": {
                                "mime_type": clean_mime,
                                "data": b64_audio,
                            }
                        },
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 300,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates") or []
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        transcript = parts[0]["text"].strip()
                        if transcript:
                            return transcript
            else:
                logger.warning("Gemini STT returned status %d: %s", res.status_code, res.text[:200])
        except Exception as exc:
            logger.warning("Gemini STT error: %s", exc)
        return None

    async def answer_safety_question(
        self, question: str, language: str = "en", context: str | None = None
    ) -> str | None:
        """Provide a simple, clear, elder-friendly answer to a user safety question."""
        url = self._get_url()
        if not url or not question.strip():
            return None

        target_lang = LANG_NAMES.get(language.lower(), "English")
        ctx_prompt = f"\nRelevant context from user's current payment/message check:\n{context}\n" if context else ""

        prompt = (
            "You are Saarthi SafePay assistant, a warm, protective, and easy-to-understand digital safety companion "
            "for Indian mobile users (especially senior citizens and first-time digital payment users).\n"
            f"Target output language: {target_lang}.\n"
            f"{ctx_prompt}"
            f"User Question: {question}\n\n"
            "Guidelines:\n"
            "- Speak directly to the user in a calm, protective, respectful tone.\n"
            "- Keep your response between 2 and 4 sentences. Make it very easy to understand.\n"
            "- If the question relates to OTP, UPI PIN, money transfers, electricity cutoffs, or lottery, "
            "firmly remind them: 'Never share your UPI PIN or OTP. You never enter a UPI PIN to receive money.'\n"
            "- Answer directly in the requested language."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 400,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates") or []
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
            else:
                logger.warning("Gemini Q&A returned status %d: %s", res.status_code, res.text[:200])
        except Exception as exc:
            logger.warning("Gemini Q&A error: %s", exc)
        return None

    async def analyze_message_or_content(
        self, text: str, language: str = "en"
    ) -> dict[str, Any] | None:
        """Deeply analyze arbitrary scanned or pasted message/text.

        Thinks before replying and avoids generic canned responses.
        """
        url = self._get_url()
        if not url or not text.strip():
            return None

        target_lang = LANG_NAMES.get(language.lower(), "English")

        prompt = f"""You are an expert Indian digital payment & cyber scam investigator protecting ordinary citizens and elders.
A user has submitted the following text, message, or link:
\"\"\"{text.strip()}\"\"\"

Analyze this content thoroughly.
THINK BEFORE REPLYING:
1. Is this an actual UPI QR payment transfer? (Almost always false unless it starts with upi://pay or has a direct UPI VPA address).
2. What is this message REALLY about? (e.g. electricity bill threat, fake KYC update, courier delivery scam, lottery prize, part-time job fraud, bank debit SMS, promotional advertisement, or casual conversation).
3. Risk level: 'high' (fraud, scam, phishing, extortion, PIN/OTP theft), 'medium' (unverified claims, suspicious links, unknown sender), or 'low' (safe, routine communication, or normal greeting).
4. Category: 'scam', 'promotional', 'legitimate', or 'unknown'.
5. Explanation: Provide a plain-language explanation (2-3 sentences) in {target_lang} explaining exactly what this message is and why it is safe or dangerous.
6. Safe next steps: 2-3 concrete bullet points in {target_lang} advising the user what to do right now.

Respond ONLY with valid JSON matching this schema:
{{
  "is_payment": false,
  "category": "scam" | "promotional" | "legitimate" | "unknown",
  "risk_level": "high" | "medium" | "low",
  "title": "Short title in {target_lang}",
  "summary": "1-sentence summary in {target_lang}",
  "explanation": "Detailed plain explanation in {target_lang}",
  "recommended_actions": ["step 1 in {target_lang}", "step 2 in {target_lang}"],
  "warning_signs": [
    {{"title": "Title in {target_lang}", "detail": "Detail in {target_lang}", "severity": "high" | "medium"}}
  ]
}}"""

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json",
            },
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates") or []
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        raw_json = parts[0]["text"].strip()
                        return json.loads(raw_json)
            else:
                logger.warning("Gemini analyze returned status %d: %s", res.status_code, res.text[:200])
        except Exception as exc:
            logger.warning("Gemini message analysis error: %s", exc)
        return None

    async def scam_roleplay_reply(
        self,
        scenario: str,
        user_message: str,
        history: list[dict[str, str]],
        language: str = "en",
    ) -> str | None:
        """Generate a realistic scammer reply for educational simulation."""
        url = self._get_url()
        if not url:
            return None

        target_lang = LANG_NAMES.get(language.lower(), "English")
        scenario_prompts = {
            "fake_bank": (
                "You are an actor playing a high-pressure scammer named Rajesh from National Bank of India. "
                "You are calling the user, claiming their account or card will be permanently blocked in 30 minutes "
                "unless they verify their OTP, UPI PIN, or date of birth right now. "
                f"Keep your reply under 35 words. Respond in {target_lang}. Educational simulation only."
            ),
            "lottery_email": (
                "You are an actor playing a persistent scammer named David Williams from UK International Lottery. "
                "The user 'won' Rs 25 lakh, but they must urgently pay a Rs 5,000 processing fee via UPI to release it. "
                f"Keep your reply under 35 words. Respond in {target_lang}. Educational simulation only."
            ),
            "grandchild_emergency": (
                "You are an actor playing an impostor pretending to be the user's grandchild Arjun. "
                "You were in an accident and urgently need Rs 15,000 sent to a UPI number for hospital treatment. "
                "Beg them not to tell parents yet so they don't panic. "
                f"Keep your reply under 35 words. Respond in {target_lang}. Educational simulation only."
            ),
        }
        sys_prompt = scenario_prompts.get(scenario, scenario_prompts["fake_bank"])

        conversation_lines = [f"System: {sys_prompt}"]
        for h in history[-4:]:
            r = h.get("role", "user")
            c = h.get("content", "")
            conversation_lines.append(f"{r.capitalize()}: {c}")
        conversation_lines.append(f"User: {user_message}")
        conversation_lines.append("Scammer (under 35 words):")

        full_prompt = "\n".join(conversation_lines)
        payload = {
            "contents": [{"parts": [{"text": full_prompt}]}],
            "generationConfig": {
                "temperature": 0.5,
                "maxOutputTokens": 100,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates") or []
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
        except Exception as exc:
            logger.warning("Gemini roleplay error: %s", exc)
        return None

    async def explain_jargon(self, term: str, language: str = "en") -> str | None:
        """Explain a technical or financial term in simple language for elders."""
        url = self._get_url()
        if not url:
            return None

        target_lang = LANG_NAMES.get(language.lower(), "English")
        prompt = (
            f"Explain the digital payment/UPI term '{term}' in 2 very simple, reassuring sentences "
            f"for an elderly person in India in {target_lang}. "
            "Clearly mention whether this is something they should keep private (like PIN/OTP) or if it is safe to share."
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 200,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates") or []
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"].strip()
        except Exception as exc:
            logger.warning("Gemini jargon explanation error: %s", exc)
        return None


_gemini_service: GeminiService | None = None


def get_gemini_service() -> GeminiService:
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service

