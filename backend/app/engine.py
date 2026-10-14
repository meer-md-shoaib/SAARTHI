"""Deterministic, explainable payment-safety engine.

Design principles
-----------------
* Explicit rules with stable identifiers - no model output, no randomness.
* Every verdict is explainable: triggered rules, per-check status, evidence.
* AI services (speech, Q&A) can never modify or override a verdict.
* Output strings are localised (en / hi / kn) so voice guidance matches the UI.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from .localization import get_strings

ENGINE_VERSION = "1.0.0"

# Amount at or above which an unconfirmed payment is flagged as unusually large.
HIGH_AMOUNT_THRESHOLD = 100_000.0


class Severity(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    INFO = "info"


class Outcome(str, Enum):
    LOW = "low_concern"
    CAREFUL = "be_careful"
    HIGH = "high_concern"
    UNKNOWN = "unable_to_verify"


# --- Rule catalogue ----------------------------------------------------------
# Order is the display order (most severe first).

RULE_SEVERITY: dict[str, Severity] = {
    "SECRET_REQUEST": Severity.HIGH,
    "URGENCY_PRESSURE": Severity.HIGH,
    "INTENT_MISMATCH": Severity.HIGH,
    "AMOUNT_MISMATCH": Severity.HIGH,
    "AMOUNT_NOT_SHOWN": Severity.MEDIUM,
    "AMOUNT_HIGH": Severity.MEDIUM,
    "INVALID_VPA": Severity.MEDIUM,
    "UNSUPPORTED_INFO": Severity.MEDIUM,
    "INTENT_UNKNOWN": Severity.MEDIUM,
}

RULE_ORDER: list[str] = [
    "SECRET_REQUEST",
    "URGENCY_PRESSURE",
    "INTENT_MISMATCH",
    "AMOUNT_MISMATCH",
    "AMOUNT_NOT_SHOWN",
    "AMOUNT_HIGH",
    "INVALID_VPA",
    "UNSUPPORTED_INFO",
    "INTENT_UNKNOWN",
]

# Rules that mean "we could not read enough information" -> unable_to_verify
# unless a high-severity rule also fired (safety first).
INSUFFICIENT_RULES = {"INVALID_VPA", "UNSUPPORTED_INFO"}


# --- Pattern tables (en / hi / kn) -------------------------------------------

def _rx(pattern: str) -> re.Pattern[str]:
    return re.compile(pattern, re.IGNORECASE)


# Requests for secrets. Matched against the whole scanned/entered text.
SECRET_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    "en": [
        _rx(r"\bupi\s+pin\b"),
        _rx(r"\bpin\b(?!\s*code)"),
        _rx(r"\botp\b"),
        _rx(r"\bone[\s-]time\s+password\b"),
        _rx(r"\bmpin\b"),
        _rx(r"\bcvv\d?\b"),
        _rx(r"\batm\s+pin\b"),
        _rx(r"\bpassword\b"),
        _rx(r"\bpasscode\b"),
        _rx(r"\bsecret\s+(code|key)\b"),
        _rx(r"\bcard\s+(number|no\.?)\b"),
        _rx(r"\bexpiry\s+date\b"),
        _rx(r"\bnet\s+banking\s+password\b"),
    ],
    "hi": [
        re.compile("ओटीपी"),
        re.compile("ओ\\.टी\\.पी"),
        re.compile("एटीएम पिन"),
        re.compile("पासवर्ड"),
        re.compile("गोपनीय"),
        re.compile("कार्ड नंबर"),
        re.compile("सीवीवी"),
        re.compile("पिन"),
    ],
    "kn": [
        re.compile("ಒಟಿಪಿ"),
        re.compile("ಒ\\.ಟಿ\\.ಪಿ"),
        re.compile("ಪಾಸ್‌ವರ್ಡ್"),
        re.compile("ಪಾಸ್ವರ್ಡ್"),
        re.compile("ಎಟಿಎಂ ಪಿನ್"),
        re.compile("ಕಾರ್ಡ್ ಸಂಖ್ಯೆ"),
        re.compile("ಸಿವಿವಿ"),
        re.compile("ಪಿನ್"),
    ],
}

# If any of these appear shortly BEFORE a secret term, the text is telling the
# user *not* to share it (a safety reminder) rather than asking for it.
NEGATIONS: list[str] = [
    "never", "do not", "don't", "dont", "no need", "not required", "avoid",
    "shouldn't", "should not",
    "न करें", "न दें", "न बताएं", "नहीं", "कभी", "मत दें", "साझा न",
    "ಬೇಡಿ", "ಮಾಡಬೇಡಿ", "ನೀಡಬೇಡಿ", "ಹಂಚಿಕೊಳ್ಳಬೇಡಿ",
]

# Urgency, threats and pressure.
URGENCY_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    "en": [
        _rx(r"\bimmediately\b"),
        _rx(r"\bact now\b"),
        _rx(r"\bright now\b"),
        _rx(r"\burgent(ly)?\b"),
        _rx(r"\bhurry\b"),
        _rx(r"\blast warning\b"),
        _rx(r"\bfinal warning\b"),
        _rx(r"\bwithin\s+\d+\s*(minutes?|hours?|mins?|days?)\b"),
        _rx(r"\baccount\s+(will\s+be\s+|has\s+been\s+)?(blocked|suspended|frozen|deactivated|locked)\b"),
        _rx(r"\bwill\s+be\s+(blocked|suspended|frozen)\b"),
        _rx(r"\bblocked\b"),
        _rx(r"\bsuspended\b"),
        _rx(r"\bfrozen\b"),
        _rx(r"\bpolice\b"),
        _rx(r"\barrest(ed)?\b"),
        _rx(r"\bjail\b"),
        _rx(r"\blegal\s+action\b"),
        _rx(r"\bkyc\b"),
        _rx(r"\bverify\s+your\s+(account|identity)\b"),
        _rx(r"\bvalidate\s+your\b"),
        _rx(r"\bupdate\s+your\s+(kyc|details|information)\b"),
        _rx(r"\bexpires?\s+(today|soon)\b"),
        _rx(r"\bexpiring\b"),
        _rx(r"\bdo\s+not\s+tell\s+anyone\b"),
        _rx(r"\bkeep\s+(this\s+|it\s+)?secret\b"),
        _rx(r"\bright\s+away\b"),
        _rx(r"\bas\s+soon\s+as\s+possible\b"),
        _rx(r"\bpenalty\b"),
        _rx(r"\bfailure\s+to\b"),
        _rx(r"\blimited\s+time\b"),
    ],
    "hi": [
        re.compile("तुरंत"),
        re.compile("तत्काल"),
        re.compile("अभी"),
        re.compile("जल्दी"),
        re.compile("आज ही"),
        re.compile("अंतिम चेतावनी"),
        re.compile("ब्लॉक"),
        re.compile("खाता बंद"),
        re.compile("निलंबित"),
        re.compile("फ्रीज़"),
        re.compile("गिरफ्तार"),
        re.compile("पुलिस"),
        re.compile("जेल"),
        re.compile("कानूनी कार्रवाई"),
        re.compile("केवाईसी"),
        re.compile("सत्यापित करें"),
        re.compile("जुर्माना"),
        re.compile("पैनल्टी"),
        re.compile("सीमित समय"),
    ],
    "kn": [
        re.compile("ತಕ್ಷಣ"),
        re.compile("ಈಗಲೇ"),
        re.compile("ಬೇಗನೆ"),
        re.compile("ಇಂದೇ"),
        re.compile("ಅಂತಿಮ ಎಚ್ಚರಿಕೆ"),
        re.compile("ನಿರ್ಬಂಧ"),
        re.compile("ಬ್ಲಾಕ್"),
        re.compile("ನಿಲ್ಲಿಸಲಾಗಿದೆ"),
        re.compile("ಬಂಧನ"),
        re.compile("ಪೊಲೀಸ್"),
        re.compile("ಜೈಲು"),
        re.compile("ಕಾನೂನು ಕ್ರಮ"),
        re.compile("ಕೆವೈಸಿ"),
        re.compile("ದಂಡ"),
        re.compile("ಖಾತೆ ಮುಚ್ಚಲಾಗಿದೆ"),
        re.compile("ಸೀಮಿತ ಸಮಯ"),
    ],
}

# Claims that the user will RECEIVE money (used to catch "scan to receive" scams).
RECEIVE_CLAIM_PATTERNS: dict[str, list[re.Pattern[str]]] = {
    "en": [
        _rx(r"you\s+will\s+(receive|get)\b"),
        _rx(r"\bwill\s+be\s+credited\b"),
        _rx(r"credited\s+to\s+your\b"),
        _rx(r"money\s+will\s+be\s+added\b"),
        _rx(r"\breceive\s+(money|payment|funds)\b"),
        _rx(r"to\s+receive\s+(money|funds)\b"),
        _rx(r"scan\s+this\s+(qr|code)\s+to\s+(receive|get|claim)\b"),
        _rx(r"\bclaim\s+your\b"),
        _rx(r"\bcashback\b"),
        _rx(r"\brefund\s+will\b"),
        _rx(r"you\s+have\s+won\b"),
        _rx(r"you\s+are\s+the\s+winner\b"),
    ],
    "hi": [
        re.compile("पैसे प्राप्त"),
        re.compile("पैसे मिलेंगे"),
        re.compile("प्राप्त करें"),
        re.compile("खाते में जमा"),
        re.compile("जमा होंगे"),
        re.compile("कैशबैक"),
        re.compile("आप जीते"),
        re.compile("लॉटरी"),
        re.compile("विजेता"),
        re.compile("रिफंड"),
        re.compile("पैसे आएंगे"),
        re.compile("इनाम"),
    ],
    "kn": [
        re.compile("ಹಣ ಪಡೆಯಿರಿ"),
        re.compile("ಹಣ ಬರುತ್ತದೆ"),
        re.compile("ಜಮೆಯಾಗುತ್ತದೆ"),
        re.compile("ಕ್ಯಾಶ್‌ಬ್ಯಾಕ್"),
        re.compile("ಗೆದ್ದಿದ್ದೀರಿ"),
        re.compile("ಲಾಟರಿ"),
        re.compile("ವಿಜೇತ"),
        re.compile("ಮರುಪಾವತಿ"),
        re.compile("ಬಹುಮಾನ"),
    ],
}

# Amounts inside free text (used only when the payload has no structured amount).
AMOUNT_PATTERNS: list[re.Pattern[str]] = [
    re.compile(r"(?<![A-Za-z])(?:₹|rs\.?\s?|inr\s?)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)", re.IGNORECASE),
    re.compile(r"([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*(?:rupees|₹)(?![A-Za-z])", re.IGNORECASE),
]

VPA_RE = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z0-9]{2,64}$")
EMBEDDED_VPA_RE = re.compile(
    r"(?<![A-Za-z0-9._-])([a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z0-9]{2,64})(?![A-Za-z0-9.-])"
)
UPI_PAY_RE = re.compile(r"upi:(?://)?pay\b[^\s]*", re.IGNORECASE)
URL_RE = re.compile(r"^(?:https?://|www\.)\S+$", re.IGNORECASE)

BANK_HANDLES: dict[str, str] = {
    # Google Pay certified handles
    "okhdfcbank": "HDFC Bank",
    "oksbi": "State Bank of India",
    "okaxis": "Axis Bank",
    "okicici": "ICICI Bank",
    # PhonePe certified handles
    "ybl": "YES Bank (PhonePe)",
    "ibl": "ICICI Bank (PhonePe)",
    "axl": "Axis Bank (PhonePe)",
    # Paytm certified handles
    "paytm": "Paytm Payments Bank",
    "ptsbi": "State Bank of India (Paytm)",
    "pthdfc": "HDFC Bank (Paytm)",
    "ptaxis": "Axis Bank (Paytm)",
    "pticici": "ICICI Bank (Paytm)",
    # BHIM / NPCI
    "upi": "NPCI BHIM UPI",
    # Major Public and Private Banks
    "sbi": "State Bank of India",
    "sbiupi": "State Bank of India",
    "hdfcbank": "HDFC Bank",
    "icici": "ICICI Bank",
    "eazypay": "ICICI Bank EazyPay",
    "axisbank": "Axis Bank",
    "axis": "Axis Bank",
    "kotak": "Kotak Mahindra Bank",
    "kmbl": "Kotak Mahindra Bank",
    "pnb": "Punjab National Bank",
    "barodampay": "Bank of Baroda",
    "bob": "Bank of Baroda",
    "cnrb": "Canara Bank",
    "canarabank": "Canara Bank",
    "unionbank": "Union Bank of India",
    "unionbankofindia": "Union Bank of India",
    "uboi": "Union Bank of India",
    "indianbank": "Indian Bank",
    "indbank": "Indian Bank",
    "boi": "Bank of India",
    "cbi": "Central Bank of India",
    "idfcbank": "IDFC FIRST Bank",
    "idfc": "IDFC FIRST Bank",
    "indus": "IndusInd Bank",
    "indusind": "IndusInd Bank",
    "federal": "Federal Bank",
    "fed": "Federal Bank",
    "yesbank": "YES Bank",
    "rbl": "RBL Bank",
    "bandhan": "Bandhan Bank",
    "uco": "UCO Bank",
    "postbank": "India Post Payments Bank",
    "ippb": "India Post Payments Bank",
    "airtel": "Airtel Payments Bank",
    "airtelbank": "Airtel Payments Bank",
    "jio": "Jio Payments Bank",
    "jiopay": "Jio Payments Bank",
    "aubank": "AU Small Finance Bank",
    # Amazon Pay & WhatsApp Pay
    "apl": "Amazon Pay (Axis Bank)",
    "rapl": "Amazon Pay (RBL Bank)",
    "yapl": "Amazon Pay (YES Bank)",
    "waaxis": "WhatsApp Pay (Axis Bank)",
    "wahdfc": "WhatsApp Pay (HDFC Bank)",
    "waicici": "WhatsApp Pay (ICICI Bank)",
    "wasbi": "WhatsApp Pay (SBI)",
    # Fintech & Digital PSPs
    "slice": "Slice (Axis Bank)",
    "axisb": "CRED (Axis Bank)",
    "cbwq": "CRED",
    "ikwik": "MobiKwik",
    "freecharge": "Freecharge (Axis Bank)",
    "jupiteraxis": "Jupiter (Axis Bank)",
    "tapicici": "Tata Neu (ICICI Bank)",
    "navi": "Navi",
    "scb": "Standard Chartered Bank",
    "hsbc": "HSBC Bank",
    "kvb": "Karur Vysya Bank",
    "sib": "South Indian Bank",
}

# Suspicious words often used in scam VPAs to impersonate KYC, refund, lottery, or support
VPA_SCAM_KEYWORDS: list[str] = [
    "kyc", "refund", "cashback", "reward", "lottery", "winner", "prize",
    "helpline", "tollfree", "toll-free", "customercare", "customer.care",
    "customer-care", "support", "verification", "unblock", "suspended",
    "electricity-bill", "electricity.bill", "billdesk", "bonus", "freegift", "free-gift"
]


# --- Extraction ---------------------------------------------------------------

@dataclass
class Extraction:
    kind: str = "empty"  # upi_pay | vpa | url | text | empty
    payee_vpa: str | None = None
    payee_name: str | None = None
    amount: float | None = None
    amount_source: str | None = None  # structured | text
    currency: str | None = None
    note: str | None = None
    transaction_ref: str | None = None
    merchant_code: str | None = None
    link: str | None = None
    supported: bool = False
    bank_name: str | None = None
    reasons: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        return {
            "kind": self.kind,
            "payee_vpa": self.payee_vpa,
            "payee_name": self.payee_name,
            "amount": self.amount,
            "amount_source": self.amount_source,
            "currency": self.currency,
            "note": self.note,
            "transaction_ref": self.transaction_ref,
            "merchant_code": self.merchant_code,
            "link": self.link,
            "supported": self.supported,
            "bank_name": self.bank_name,
        }


def _decode(raw: str) -> str:
    text = raw.strip()
    for _ in range(3):
        if "%" not in text:
            break
        decoded = unquote(text)
        if decoded == text:
            break
        text = decoded
    return text


def _first_amount(text: str) -> float | None:
    for pattern in AMOUNT_PATTERNS:
        match = pattern.search(text)
        if match:
            try:
                return float(match.group(1).replace(",", ""))
            except ValueError:
                continue
    return None


def _parse_float(value: str | None) -> float | None:
    if value is None:
        return None
    try:
        parsed = float(value.replace(",", ""))
    except ValueError:
        return None
    if parsed < 0 or parsed != parsed:  # negative or NaN
        return None
    return parsed


def _find_upi_payload(original: str, decoded: str) -> str | None:
    """Locate an ``upi://pay`` payload, tolerating encoded or typed text.

    Real QR payloads are URL-encoded (no spaces); people typing a payload by
    hand often include spaces. Try the strict no-space match first, and fall
    back to the rest of the line when the parameters clearly continue past it.
    """
    for source in (original, decoded):
        if not source:
            continue
        match = UPI_PAY_RE.search(source)
        if not match:
            continue
        candidate = match.group(0).rstrip(".,;:)]}\"'")
        line = source[match.start() :].splitlines()[0].strip().rstrip(".,;:)]}\"'")
        rest = line[match.end() - match.start() :]
        line_continues_params = bool(rest) and ("&" in rest or "?" in rest)
        candidate_missing_pa = "pa=" not in candidate.lower()
        if len(line) <= 4000 and (
            line_continues_params or (candidate_missing_pa and "pa=" in line.lower())
        ):
            return line
        return candidate
    return None


def extract_payment_info(raw_text: str) -> Extraction:
    """Pull only supported payment information out of scanned/entered data."""
    original = raw_text.strip()
    text = _decode(raw_text)
    info = Extraction()
    if not text:
        info.reasons = ["empty"]
        return info

    url_text = _find_upi_payload(original, text)
    if url_text:
        info.kind = "upi_pay"
        parsed_url = urlparse(url_text)
        query_str = parsed_url.query
        if not query_str and "?" in url_text:
            query_str = url_text.split("?", 1)[1]
        query = parse_qs(query_str, keep_blank_values=True)
        params = {key.lower(): values for key, values in query.items()}

        def param(name: str) -> str | None:
            values = params.get(name)
            return values[0].strip() if values and values[0] else None

        vpa = param("pa")
        info.payee_vpa = vpa or None
        info.payee_name = param("pn")
        info.note = param("tn")
        info.transaction_ref = param("tr")
        info.merchant_code = param("mc")
        info.amount = _parse_float(param("am") or param("amount"))
        if info.amount is not None:
            info.amount_source = "structured"
            info.currency = (param("cu") or "INR").upper()
        return _finalize(info)

    whole = text.strip()
    if VPA_RE.match(whole):
        info.kind = "vpa"
        info.payee_vpa = whole
        return _finalize(info)

    if URL_RE.match(whole):
        info.kind = "url"
        info.link = whole
        info.reasons = ["unsupported_link"]
        return info

    embedded = EMBEDDED_VPA_RE.search(text)
    amount = _first_amount(text)
    if embedded:
        info.kind = "vpa"
        info.payee_vpa = embedded.group(1)
        info.amount = amount
        if amount is not None:
            info.amount_source = "text"
            info.currency = "INR"
        return _finalize(info)

    info.kind = "text"
    info.amount = amount
    if amount is not None:
        info.amount_source = "text"
        info.currency = "INR"
        info.reasons = ["missing_payee"]
    else:
        info.reasons = ["no_payment_info"]
    return info


def _finalize(info: Extraction) -> Extraction:
    if info.payee_vpa is None:
        if "missing_payee" not in info.reasons and not info.reasons:
            info.reasons = ["missing_payee"]
        info.supported = False
    elif VPA_RE.match(info.payee_vpa) is None:
        info.reasons = ["invalid_payee"]
        info.supported = False
    else:
        handle = info.payee_vpa.split("@")[1].lower() if "@" in info.payee_vpa else ""
        info.bank_name = BANK_HANDLES.get(handle)
        if not info.bank_name:
            info.reasons = ["unknown_bank_handle"]
            info.supported = False
        else:
            info.reasons = []
            info.supported = info.kind in ("upi_pay", "vpa")
        if not info.supported and not info.reasons:
            info.reasons = ["no_payment_info"]
    return info


# --- Rule evaluation ----------------------------------------------------------

@dataclass
class RuleHit:
    rule_id: str
    severity: Severity
    evidence: str | None = None
    detail_variant: str | None = None
    fields: dict[str, str] = field(default_factory=dict)


def _find_match(patterns: list[re.Pattern[str]], text: str) -> str | None:
    for pattern in patterns:
        match = pattern.search(text)
        if match:
            return match.group(0).strip()
    return None


def _find_secret(text: str) -> str | None:
    for language_patterns in SECRET_PATTERNS.values():
        for pattern in language_patterns:
            match = pattern.search(text)
            if not match:
                continue
            window = text[max(0, match.start() - 70) : match.start()].lower()
            if any(negation in window for negation in NEGATIONS):
                continue
            return match.group(0).strip()
    return None


def _has_receive_claim(text: str) -> str | None:
    for language_patterns in RECEIVE_CLAIM_PATTERNS.values():
        found = _find_match(language_patterns, text)
        if found:
            return found
    return None


def format_amount(value: float | None) -> str:
    if value is None:
        return "-"
    if abs(value - round(value)) < 1e-9:
        return f"₹{int(round(value)):,}"
    return f"₹{value:,.2f}"


def evaluate_rules(
    info: Extraction,
    intention: str,
    expected_amount: float | None,
    raw_text: str,
) -> tuple[list[RuleHit], dict[str, str]]:
    """Return (triggered rules, rule_id -> check status)."""
    text = _decode(raw_text)
    hits: list[RuleHit] = []
    status: dict[str, str] = {rule_id: "not_applicable" for rule_id in RULE_ORDER}

    def mark(rule_id: str, applicable: bool, hit: RuleHit | None = None) -> None:
        if not applicable:
            status[rule_id] = "not_applicable"
            return
        if hit is not None:
            status[rule_id] = "triggered"
            hits.append(hit)
        elif status[rule_id] != "triggered":
            status[rule_id] = "clear"

    # 1. Secrets -------------------------------------------------------------
    secret = _find_secret(text)
    mark(
        "SECRET_REQUEST",
        applicable=bool(text),
        hit=RuleHit("SECRET_REQUEST", Severity.HIGH, evidence=secret) if secret else None,
    )

    # 2. Urgency / threats & VPA Impersonation ---------------------------------
    urgency = None
    for language_patterns in URGENCY_PATTERNS.values():
        urgency = _find_match(language_patterns, text)
        if urgency:
            break

    # Also detect scam / phishing / impersonation keywords in the UPI VPA itself
    if not urgency and info.payee_vpa:
        vpa_user = info.payee_vpa.split("@")[0].lower()
        matched_kw = next((kw for kw in VPA_SCAM_KEYWORDS if kw in vpa_user), None)
        if matched_kw:
            urgency = f"Suspicious keyword '{matched_kw}' in address: {info.payee_vpa}"

    mark(
        "URGENCY_PRESSURE",
        applicable=bool(text or info.payee_vpa),
        hit=RuleHit("URGENCY_PRESSURE", Severity.HIGH, evidence=urgency) if urgency else None,
    )

    # 3. Intent mismatch ------------------------------------------------------
    intent_known = intention in ("pay", "receive")
    relevant = intent_known and (info.kind in ("upi_pay", "vpa"))
    mismatch_hit: RuleHit | None = None
    if relevant and intention == "receive":
        mismatch_hit = RuleHit(
            "INTENT_MISMATCH", Severity.HIGH, detail_variant="detail_receive"
        )
    elif relevant and intention == "pay":
        claim = _has_receive_claim(text)
        if claim:
            mismatch_hit = RuleHit(
                "INTENT_MISMATCH", Severity.HIGH, evidence=claim, detail_variant="detail_claim"
            )
    mark("INTENT_MISMATCH", applicable=relevant, hit=mismatch_hit)

    # 4. Amount discrepancies -------------------------------------------------
    amounts_comparable = expected_amount is not None and info.amount is not None
    mismatch_hit = None
    if amounts_comparable and abs(info.amount - expected_amount) > 0.005:
        mismatch_hit = RuleHit(
            "AMOUNT_MISMATCH",
            Severity.HIGH,
            fields={
                "qr_amount": format_amount(info.amount),
                "expected_amount": format_amount(expected_amount),
            },
        )
    mark("AMOUNT_MISMATCH", applicable=expected_amount is not None, hit=mismatch_hit)

    amount_missing_applicable = expected_amount is not None and (info.kind in ("upi_pay", "vpa"))
    missing_hit = None
    if amount_missing_applicable and info.amount is None:
        missing_hit = RuleHit(
            "AMOUNT_NOT_SHOWN",
            Severity.MEDIUM,
            fields={"expected_amount": format_amount(expected_amount)},
        )
    mark("AMOUNT_NOT_SHOWN", applicable=amount_missing_applicable, hit=missing_hit)

    high_applicable = (
        info.amount is not None
        and expected_amount is None
        and intention == "pay"
    )
    high_hit = None
    if high_applicable and info.amount >= HIGH_AMOUNT_THRESHOLD:
        high_hit = RuleHit(
            "AMOUNT_HIGH", Severity.MEDIUM, fields={"qr_amount": format_amount(info.amount)}
        )
    mark("AMOUNT_HIGH", applicable=high_applicable, hit=high_hit)

    # 5. Missing / unsupported information ------------------------------------
    has_payee = info.payee_vpa is not None
    handle = (
        info.payee_vpa.split("@")[1].lower()
        if (has_payee and "@" in info.payee_vpa)
        else ""
    )
    is_handle_known = handle in BANK_HANDLES
    payee_invalid = has_payee and (
        VPA_RE.match(info.payee_vpa) is None or not is_handle_known
    )

    invalid_hit = (
        RuleHit("INVALID_VPA", Severity.MEDIUM, evidence=info.payee_vpa)
        if payee_invalid
        else None
    )
    mark("INVALID_VPA", applicable=has_payee, hit=invalid_hit)

    unsupported_applicable = not info.supported and not payee_invalid
    unsupported_hit = (
        RuleHit("UNSUPPORTED_INFO", Severity.MEDIUM, evidence=info.reasons[0] if info.reasons else None)
        if unsupported_applicable
        else None
    )
    mark("UNSUPPORTED_INFO", applicable=unsupported_applicable or info.supported, hit=unsupported_hit)
    # A payload with a valid payee has "enough information" -> clear, not skipped.
    if info.supported and status["UNSUPPORTED_INFO"] == "not_applicable":
        status["UNSUPPORTED_INFO"] = "clear"
    if payee_invalid:
        status["UNSUPPORTED_INFO"] = "not_applicable"

    # 6. Unknown intent --------------------------------------------------------
    unknown_applicable = intention == "unknown" and info.supported
    mark("INTENT_UNKNOWN", applicable=unknown_applicable, hit=RuleHit("INTENT_UNKNOWN", Severity.MEDIUM) if unknown_applicable else None)

    return hits, status


def _decide_outcome(hits: list[RuleHit], info: Extraction) -> Outcome:
    severities = {hit.severity for hit in hits}
    if Severity.HIGH in severities:
        return Outcome.HIGH
    if not info.supported:
        return Outcome.UNKNOWN
    if Severity.MEDIUM in severities:
        return Outcome.CAREFUL
    return Outcome.LOW


# --- Assembly -----------------------------------------------------------------

def analyze_payment(
    raw_text: str,
    intention: str = "unknown",
    expected_amount: float | None = None,
    language: str = "en",
) -> dict[str, Any]:
    """Run every check and return the structured, localised verdict."""
    strings = get_strings(language)
    info = extract_payment_info(raw_text)
    hits, status = evaluate_rules(info, intention, expected_amount, raw_text)
    outcome = _decide_outcome(hits, info)

    ordered_hits = sorted(
        hits, key=lambda hit: RULE_ORDER.index(hit.rule_id)
    )

    warning_signs: list[dict[str, Any]] = []
    for hit in ordered_hits:
        rule_strings = strings["rules"][hit.rule_id]
        detail_key = hit.detail_variant or "detail"
        detail_template = rule_strings.get(detail_key, rule_strings["detail"])
        try:
            detail = detail_template.format(**hit.fields)
        except (KeyError, IndexError):
            detail = detail_template
        entry: dict[str, Any] = {
            "id": hit.rule_id,
            "severity": hit.severity.value,
            "title": rule_strings["title"],
            "detail": detail,
        }
        if hit.evidence:
            entry["evidence"] = hit.evidence
        warning_signs.append(entry)

    outcome_strings = strings["outcomes"][outcome.value]
    signs_text = "; ".join(sign["title"] for sign in warning_signs)
    reasons_text = " ".join(
        strings["reasons"].get(reason, "") for reason in info.reasons
    ).strip()
    explanation = outcome_strings["explanation"].format(
        signs=signs_text, reasons=(reasons_text + " " if reasons_text else "")
    )

    checks = [
        {
            "id": rule_id,
            "status": status[rule_id],
            "title": strings["rules"][rule_id]["title"],
        }
        for rule_id in RULE_ORDER
    ]

    return {
        "outcome": outcome.value,
        "outcome_label": outcome_strings["label"],
        "summary": outcome_strings["summary"],
        "explanation": explanation,
        "warning_signs": warning_signs,
        "recommended_actions": list(strings["actions"][outcome.value]),
        "checks": checks,
        "status_labels": dict(strings["status_labels"]),
        "extracted": info.as_dict(),
        "insufficient_reasons": [
            strings["reasons"].get(reason, reason) for reason in info.reasons
        ],
        "disclaimer": strings["disclaimer"],
        "language": language,
        "engine_version": ENGINE_VERSION,
        "ai_overrode_engine": False,
    }
