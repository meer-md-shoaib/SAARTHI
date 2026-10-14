"""Dedicated message prediction and safety analysis service.

Coordinates:
- Input sanity checking (empty, very short, out-of-distribution)
- Calibrated ML categorization (legitimate, promotional, scam)
- Secondary scam subtype and evidence extraction (otp_pin_theft, payment_fraud, phishing, impersonation, urgency_threat)
- Strict safety rules integration (deterministic high-risk rules always override ML low-risk predictions;
  never claim recipient is verified; never store/request secrets)
- Conservative fallback and actionable next steps in English, Hindi, and Kannada.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Literal

from ..engine import analyze_payment
from .classifier import MessageClassifier, get_message_classifier
from .subcategories import EvidenceMatch, ScamSubtype, extract_evidence_and_subtypes

logger = logging.getLogger("saarthi.ml.service")

RiskLevel = Literal["low", "medium", "high", "unknown"]
Category = Literal["legitimate", "promotional", "scam", "unsupported", "unknown"]


# Advice templates localized for en, hi, kn
NEXT_STEPS: dict[str, dict[str, list[str]]] = {
    "otp_pin_theft": {
        "en": [
            "Never share your 4-digit or 6-digit UPI PIN or OTP with anyone.",
            "Bank staff, electricity boards, and genuine buyers will NEVER ask for your OTP or PIN.",
            "You only enter your UPI PIN to SEND money, never to receive money.",
        ],
        "hi": [
            "अपना 4 या 6 अंकों का UPI पिन या OTP कभी किसी के साथ साझा न करें।",
            "बैंक कर्मचारी, बिजली विभाग या असली खरीदार कभी भी आपका OTP या पिन नहीं मांगते।",
            "आप UPI पिन केवल पैसे भेजने के लिए डालते हैं, पैसे पाने के लिए कभी नहीं।",
        ],
        "kn": [
            "ನಿಮ್ಮ 4 ಅಥವಾ 6 ಅಂಕಿಯ UPI ಪಿನ್ ಅಥವಾ ಒಟಿಪಿಯನ್ನು ಯಾರೊಂದಿಗೂ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
            "ಬ್ಯಾಂಕ್ ಸಿಬ್ಬಂದಿ, ವಿದ್ಯುತ್ ಇಲಾಖೆ ಅಥವಾ ಅಸಲಿ ಗ್ರಾಹಕರು ಎಂದಿಗೂ ನಿಮ್ಮ ಒಟಿಪಿ ಅಥವಾ ಪಿನ್ ಕೇಳುವುದಿಲ್ಲ.",
            "ನೀವು ಕೇವಲ ಹಣ ಕಳುಹಿಸುವಾಗ ಮಾತ್ರ UPI ಪಿನ್ ನಮೂದಿಸುತ್ತೀರಿ, ಹಣ ಪಡೆಯುವಾಗ ಎಂದಿಗೂ ಅಲ್ಲ.",
        ],
    },
    "payment_fraud": {
        "en": [
            "Do not scan QR codes or approve refund/collect requests to receive funds.",
            "Ignore claims of accidental transfers or lottery rewards requiring processing fees.",
            "Report fraudulent numbers or UPI IDs to 1930 or cybercrime.gov.in.",
        ],
        "hi": [
            "पैसे पाने के लिए QR कोड स्कैन न करें और न ही रिफंड रिक्वेस्ट स्वीकार करें।",
            "गलती से भेजे गए पैसे या लॉटरी इनाम के झूठे दावों को नजरअंदाज करें।",
            "धोखाधड़ी की शिकायत 1930 पर या cybercrime.gov.in पर तुरंत दर्ज करें।",
        ],
        "kn": [
            "ಹಣ ಪಡೆಯಲು QR ಕೋಡ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಬೇಡಿ ಅಥವಾ ರಿಫಂಡ್ ಕೋರಿಕೆಯನ್ನು ಅನುಮೋದಿಸಬೇಡಿ.",
            "ತಪ್ಪಾಗಿ ಕಳುಹಿಸಿದ ಹಣ ಅಥವಾ ಲಾಟರಿ ಬಹುಮಾನದ ಸುಳ್ಳು ಸಂದೇಶಗಳನ್ನು ನಿರ್ಲಕ್ಷಿಸಿ.",
            "ವಂಚನೆ ಸಂಖ್ಯೆಗಳನ್ನು ತಕ್ಷಣವೇ 1930 ಗೆ ಅಥವಾ cybercrime.gov.in ನಲ್ಲಿ ವರದಿ ಮಾಡಿ.",
        ],
    },
    "phishing": {
        "en": [
            "Do not click on shortened links or unknown website domains.",
            "Never download APK files or install apps like QuickSupport/AnyDesk sent over SMS or WhatsApp.",
            "Open your official bank or utility app directly from Google Play to check your status.",
        ],
        "hi": [
            "अज्ञात लिंक या छोटी वेबसाइट लिंक (short URLs) पर क्लिक न करें।",
            "SMS या WhatsApp पर आई किसी भी APK फाइल या स्क्रीन शेयरिंग ऐप को इंस्टॉल न करें।",
            "स्थिति जांचने के लिए सीधे आधिकारिक बैंक या बिजली ऐप खोलें।",
        ],
        "kn": [
            "ಅಪರಿಚಿತ ಲಿಂಕ್‌ಗಳು ಅಥವಾ ಸಂಕ್ಷಿಪ್ತ ವೆಬ್‌ಸೈಟ್‌ಗಳ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಬೇಡಿ.",
            "SMS ಅಥವಾ WhatsApp ಮೂಲಕ ಬಂದ APK ಫೈಲ್‌ಗಳನ್ನು ಎಂದಿಗೂ ಡೌನ್‌ಲೋಡ್ ಮಾಡಬೇಡಿ.",
            "ವಿವರ ಪರಿಶೀಲಿಸಲು ನೇರವಾಗಿ ಅಧಿಕೃತ ಆ್ಯಪ್ ಅನ್ನು ಮಾತ್ರ ಬಳಸಿ.",
        ],
    },
    "impersonation": {
        "en": [
            "Do not panic if a message claims your account or electricity will be blocked.",
            "Cross-verify directly with your bank branch or electricity helpline from their official website.",
            "Government officers and police never demand immediate money transfers over the phone or SMS.",
        ],
        "hi": [
            "घबराएं नहीं यदि संदेश में खाता बंद होने या बिजली कटने की धमकी दी गई हो।",
            "सीधे अपनी बैंक शाखा या आधिकारिक हेल्पलाइन नंबर से पुष्टि करें।",
            "सरकारी अधिकारी या पुलिस कभी भी फोन या SMS पर तुरंत पैसे ट्रांसफर करने को नहीं कहते।",
        ],
        "kn": [
            "ಖಾತೆ ಸ್ಥಗಿತ ಅಥವಾ ವಿದ್ಯುತ್ ಕಡಿತದ ಬೆದರಿಕೆಗೆ ಹೆದರಬೇಡಿ.",
            "ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿರುವ ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆಗೆ ಕರೆ ಮಾಡಿ ಪರಿಶೀಲಿಸಿ.",
            "ಸರ್ಕಾರಿ ಅಧಿಕಾರಿಗಳು ಅಥವಾ ಪೊಲೀಸರು ಎಂದಿಗೂ ಫೋನ್ ಮೂಲಕ ಹಣ ವರ್ಗಾವಣೆಗೆ ಒತ್ತಾಯಿಸುವುದಿಲ್ಲ.",
        ],
    },
    "urgency_threat": {
        "en": [
            "Scammers create artificial deadlines to rush you into a mistake. Slow down and verify.",
            "Do not make urgent payments or share confidential details under pressure.",
            "Discuss with a trusted family member before taking any action.",
        ],
        "hi": [
            "धोखेबाज़ आपको जल्दबाज़ी में फंसाने के लिए तुरंत कार्रवाई का दबाव बनाते हैं। शांत रहें और जांचें।",
            "दबाव में आकर कभी भी तुरंत भुगतान न करें और न ही निजी जानकारी साझा करें।",
            "कोई भी कदम उठाने से पहले अपने परिवार के किसी विश्वसनीय सदस्य से बात करें।",
        ],
        "kn": [
            "ವಂಚಕರು ಗಡಿಬಿಡಿಯಲ್ಲಿ ತಪ್ಪು ಮಾಡಲು ಕೃತಕ ತುರ್ತು ಸೃಷ್ಟಿಸುತ್ತಾರೆ. ಶಾಂತವಾಗಿ ಪರಿಶೀಲಿಸಿ.",
            "ಒತ್ತಡದಲ್ಲಿ ತುರ್ತು ಪಾವತಿ ಮಾಡಬೇಡಿ ಅಥವಾ ಗೌಪ್ಯ ಮಾಹಿತಿ ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
            "ಯಾವುದೇ ನಿರ್ಧಾರ ತೆಗೆದುಕೊಳ್ಳುವ ಮುನ್ನ ಕುಟುಂಬದವರೊಂದಿಗೆ ಮಾತನಾಡಿ.",
        ],
    },
    "promotional": {
        "en": [
            "This appears to be a promotional offer or marketing message.",
            "Verify any deals or discounts directly on the retailer's official website or app.",
            "Never share payment credentials or passwords to claim discounts.",
        ],
        "hi": [
            "यह एक प्रचार या विज्ञापन संदेश प्रतीत होता है।",
            "ऑफ़र या छूट की पुष्टि सीधे कंपनी की आधिकारिक वेबसाइट या ऐप पर करें।",
            "छूट पाने के लिए कभी भी भुगतान पिन या पासवर्ड साझा न करें।",
        ],
        "kn": [
            "ಇದು ಪ್ರಚಾರದ ಕೊಡುಗೆ ಅಥವಾ ಜಾಹೀರಾತು ಸಂದೇಶದಂತೆ ಕಾಣುತ್ತದೆ.",
            "ರಿಯಾಯಿತಿಗಳನ್ನು ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್ ಅಥವಾ ಆ್ಯಪ್ ಮೂಲಕ ಮಾತ್ರ ಪರಿಶೀಲಿಸಿ.",
            "ರಿಯಾಯಿತಿ ಪಡೆಯಲು ಎಂದಿಗೂ ಪಾವತಿ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
        ],
    },
    "legitimate": {
        "en": [
            "This message appears consistent with routine communications.",
            "Always verify recipient names and amounts independently before making any UPI payment.",
            "Note: A legitimate message does not guarantee that unknown third parties are verified.",
        ],
        "hi": [
            "यह संदेश सामान्य और नियमित संचार जैसा प्रतीत होता है।",
            "कोई भी UPI भुगतान करने से पहले प्राप्तकर्ता का नाम और राशि स्वयं सत्यापित करें।",
            "ध्यान दें: संदेश सामान्य दिखने का मतलब यह नहीं कि कोई अज्ञात व्यक्ति सत्यापित है।",
        ],
        "kn": [
            "ಈ ಸಂದೇಶವು ಸಾಮಾನ್ಯ ಸಂವಹನದಂತೆ ಕಾಣುತ್ತದೆ.",
            "ಯಾವುದೇ ಪಾವತಿ ಮಾಡುವ ಮೊದಲು ಸ್ವೀಕರಿಸುವವರ ಹೆಸರು ಮತ್ತು ಮೊತ್ತವನ್ನು ಪರಿಶೀಲಿಸಿ.",
            "ಗಮನಿಸಿ: ಸಂದೇಶ ನೈಜವಾಗಿ ಕಂಡರೂ ಅಪರಿಚಿತ ವ್ಯಕ್ತಿಗಳು ಪರಿಶೀಲಿಸಲ್ಪಟ್ಟಿದ್ದಾರೆ ಎಂದರ್ಥವಲ್ಲ.",
        ],
    },
    "conservative_fallback": {
        "en": [
            "Insufficient context to determine message authenticity.",
            "Do not share OTPs, PINs, or bank account credentials.",
            "Consult family or verify with the official service provider if in doubt.",
        ],
        "hi": [
            "संदेश की प्रामाणिकता निर्धारित करने के लिए पर्याप्त जानकारी नहीं है।",
            "कोई भी OTP, पिन या बैंक विवरण किसी के साथ साझा न करें।",
            "संदेह होने पर परिवार से परामर्श लें या आधिकारिक सेवा प्रदाता से जांचें।",
        ],
        "kn": [
            "ಸಂದೇಶದ ನೈಜತೆಯನ್ನು ದೃಢೀಕರಿಸಲು ಸಾಕಷ್ಟು ಮಾಹಿತಿ ಇಲ್ಲ.",
            "ಯಾವುದೇ ಒಟಿಪಿ, ಪಿನ್ ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಬೇಡಿ.",
            "ಅನುಮಾನವಿದ್ದರೆ ಕುಟುಂಬದವರನ್ನು ಕೇಳಿ ಅಥವಾ ಅಧಿಕೃತ ಸಂಸ್ಥೆಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
        ],
    },
}


class MessageAnalysisService:
    """Production service for evaluating incoming payment & SMS messages."""

    def __init__(self, classifier: MessageClassifier | None = None) -> None:
        self.classifier = classifier or get_message_classifier()

    def analyze_message(
        self,
        text: str,
        language: str = "en",
    ) -> dict[str, Any]:
        """Analyze a complete SMS or communication message.

        Returns comprehensive analysis with category, confidence, risk_level,
        secondary subtypes, evidence snippets, and safe next steps.
        """
        lang = language if language in ("en", "hi", "kn") else "en"
        raw_text = text or ""
        stripped = raw_text.strip()

        # 1. Conservative handling: Empty or whitespace input
        if not stripped:
            return {
                "category": "unsupported",
                "risk_level": "unknown",
                "confidence": 0.0,
                "class_probabilities": {},
                "subcategories": [],
                "is_out_of_distribution": True,
                "evidence": [],
                "safe_next_steps": NEXT_STEPS["conservative_fallback"][lang],
                "explanation": (
                    "The provided message is empty. Please provide the message content to analyze."
                    if lang == "en"
                    else "प्रदान किया गया संदेश खाली है। कृपया विश्लेषण के लिए संदेश सामग्री दर्ज करें।"
                    if lang == "hi"
                    else "ನೀಡಿರುವ ಸಂದೇಶವು ಖಾಲಿಯಾಗಿದೆ. ದಯವಿಟ್ಟು ವಿಶ್ಲೇಷಿಸಲು ಸಂದೇಶವನ್ನು ನಮೂದಿಸಿ."
                ),
                "model_version": self.classifier.model_version,
                "safety_engine_override": False,
            }

        # 2. Conservative handling: Very short text (< 6 characters)
        if len(stripped) < 6:
            return {
                "category": "unsupported",
                "risk_level": "unknown",
                "confidence": 0.0,
                "class_probabilities": {},
                "subcategories": [],
                "is_out_of_distribution": True,
                "evidence": [],
                "safe_next_steps": NEXT_STEPS["conservative_fallback"][lang],
                "explanation": (
                    f"The text '{stripped}' is too short for reliable safety classification."
                    if lang == "en"
                    else f"पाठ '{stripped}' विश्वसनीय सुरक्षा विश्लेषण के लिए बहुत छोटा है।"
                    if lang == "hi"
                    else f"'{stripped}' ಪಠ್ಯವು ವಿಶ್ವಾಸಾರ್ಹ ಸುರಕ್ಷತಾ ವಿಶ್ಲೇಷಣೆಗೆ ತುಂಬಾ ಚಿಕ್ಕದಾಗಿದೆ."
                ),
                "model_version": self.classifier.model_version,
                "safety_engine_override": False,
            }

        # 3. Secondary evidence and subtype scanning
        subtypes, evidence_items = extract_evidence_and_subtypes(stripped)

        # 4. Deterministic safety engine inspection
        # Run payment engine to ensure high-risk deterministic findings are captured
        deterministic_result = analyze_payment(
            raw_text=stripped,
            intention="unknown",
            language=lang,  # type: ignore[arg-type]
        )

        has_high_concern_rule = (
            deterministic_result["outcome"] == "high_concern"
            or any(w["severity"] == "high" for w in deterministic_result.get("warning_signs", []))
        )

        # 5. ML Model Inference
        raw_pred = self.classifier.predict(stripped)
        pred_category = raw_pred.predicted_category
        confidence = raw_pred.confidence
        probabilities = raw_pred.class_probabilities

        # 6. Out-of-distribution (OOD) check: low confidence threshold (< 0.55)
        is_ood = confidence < 0.55

        # 7. Safety Integration & Risk Level Synthesis
        # Principle 1: High-risk deterministic findings NEVER overridden by low-risk ML
        safety_override = False
        final_risk: RiskLevel = "low"
        final_category = pred_category

        if has_high_concern_rule or len(subtypes) > 0 or pred_category == "scam":
            final_risk = "high"
            if pred_category != "scam" and (has_high_concern_rule or "otp_pin_theft" in subtypes):
                safety_override = True
                final_category = "scam"
        elif pred_category == "promotional":
            final_risk = "medium"
        elif is_ood:
            final_risk = "medium"
            final_category = "unknown"
        else:
            final_risk = "low"

        # 8. Compile Evidence Snippets
        evidence_list = [
            {
                "subtype": e.subtype,
                "title": e.title,
                "snippet": e.evidence,
                "explanation": e.explanation,
            }
            for e in evidence_items
        ]

        # Add any high-concern warning signs from deterministic engine
        for w in deterministic_result.get("warning_signs", []):
            if w["severity"] == "high" and not any(e["title"] == w["title"] for e in evidence_list):
                evidence_list.append(
                    {
                        "subtype": "payment_fraud" if "INTENT" in w["id"] else "otp_pin_theft",
                        "title": w["title"],
                        "snippet": w.get("evidence") or w["detail"],
                        "explanation": w["detail"],
                    }
                )

        # 9. Formulate Safe Next Steps
        safe_steps: list[str] = []
        if subtypes:
            primary_subtype = subtypes[0]
            safe_steps.extend(NEXT_STEPS.get(primary_subtype, {}).get(lang, []))
        elif final_category == "scam":
            safe_steps.extend(NEXT_STEPS["payment_fraud"][lang])
        elif final_category == "promotional":
            safe_steps.extend(NEXT_STEPS["promotional"][lang])
        elif final_category == "legitimate":
            safe_steps.extend(NEXT_STEPS["legitimate"][lang])
        else:
            safe_steps.extend(NEXT_STEPS["conservative_fallback"][lang])

        # 10. Summary Explanation
        explanation = self._build_explanation(
            category=final_category,
            risk=final_risk,
            confidence=confidence,
            subtypes=subtypes,
            lang=lang,
            is_ood=is_ood,
            safety_override=safety_override,
        )

        return {
            "category": final_category,
            "risk_level": final_risk,
            "confidence": confidence if not is_ood else round(confidence, 4),
            "class_probabilities": probabilities,
            "subcategories": subtypes,
            "is_out_of_distribution": is_ood,
            "evidence": evidence_list,
            "safe_next_steps": safe_steps,
            "explanation": explanation,
            "model_version": self.classifier.model_version,
            "safety_engine_override": safety_override,
        }

    def _build_explanation(
        self,
        category: str,
        risk: RiskLevel,
        confidence: float,
        subtypes: list[ScamSubtype],
        lang: str,
        is_ood: bool,
        safety_override: bool,
    ) -> str:
        pct = round(confidence * 100, 1)
        if lang == "hi":
            if safety_override or category == "scam":
                sub_str = ", ".join(subtypes) if subtypes else "धोखाधड़ी"
                return f"सावधानी: यह संदेश संदिग्ध है ({sub_str})। सुरक्षा नियमों के तहत उच्च जोखिम के रूप में चिह्नित किया गया है।"
            if category == "promotional":
                return f"यह संदेश व्यावसायिक या प्रचार संबंधी प्रतीत होता है (विश्वास: {pct}%)।"
            if category == "legitimate":
                return f"संदेश नियमित संचार प्रतीत होता है (विश्वास: {pct}%)। किसी भी भुगतान से पहले हमेशा विवरण सत्यापित करें।"
            return "संदेश असामान्य है या इसमें अस्पष्ट पैटर्न हैं। कृपया अत्यधिक सतर्क रहें।"

        if lang == "kn":
            if safety_override or category == "scam":
                sub_str = ", ".join(subtypes) if subtypes else "ವಂಚನೆ"
                return f"ಎಚ್ಚರಿಕೆ: ಈ ಸಂದೇಶವು ಸಂಶಯಾಸ್ಪದವಾಗಿದೆ ({sub_str}). ಹೆಚ್ಚಿನ ಅಪಾಯದ ಸಂದೇಶವೆಂದು ಗುರುತಿಸಲಾಗಿದೆ."
            if category == "promotional":
                return f"ಈ ಸಂದೇಶವು ಪ್ರಚಾರ ಅಥವಾ ಕೊಡುಗೆಯಂತೆ ಕಾಣುತ್ತದೆ (ವಿಶ್ವಾಸಾರ್ಹತೆ: {pct}%)."
            if category == "legitimate":
                return f"ಸಂದೇಶವು ಸಾಮಾನ್ಯ ಸಂವಹನದಂತೆ ಕಾಣುತ್ತದೆ (ವಿಶ್ವಾಸಾರ್ಹತೆ: {pct}%). ಪಾವತಿ ಮಾಡುವ ಮುನ್ನ ವಿವರ ಪರಿಶೀಲಿಸಿ."
            return "ಸಂದೇಶವು ಅಸಾಮಾನ್ಯವಾಗಿದೆ. ದಯವಿಟ್ಟು ಜಾಗರೂಕರಾಗಿರಿ."

        # Default English
        if safety_override or category == "scam":
            sub_str = ", ".join(subtypes) if subtypes else "fraud pattern"
            return (
                f"High risk detected: this message exhibits hallmarks of fraudulent intent ({sub_str}). "
                "Deterministic safety checks confirmed deceptive characteristics."
            )
        if category == "promotional":
            return f"Promotional content detected ({pct}% model confidence). Commercial marketing or advertisement."
        if category == "legitimate":
            return (
                f"Classified as legitimate ({pct}% confidence). "
                "No overt deception detected, but always independently verify recipient identities."
            )
        if is_ood:
            return (
                "Out-of-distribution input: model confidence is low. Treated conservatively as unverified."
            )
        return "Message could not be verified with high confidence. Proceed with caution."


_service_instance: MessageAnalysisService | None = None


def get_message_analysis_service() -> MessageAnalysisService:
    """Access or initialize the singleton MessageAnalysisService instance."""
    global _service_instance
    if _service_instance is None:
        _service_instance = MessageAnalysisService()
    return _service_instance
