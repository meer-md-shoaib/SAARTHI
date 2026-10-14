"""Secondary evidence and scam subtype extraction.

Extracts verifiable fraud patterns and subtype indicators without fabricating
ground-truth labels on coarse datasets.

Supported subtypes:
- otp_pin_theft: Requests for OTP, UPI PIN, passwords, CVV, or authentication secrets.
- payment_fraud: Reverse charge scams, fake refunds, lottery/prize traps, task scams.
- phishing: Suspicious URLs, credential harvesting portals, unauthorized APK links.
- impersonation: Posing as banks, utility boards, tax dept, law enforcement, or couriers.
- urgency_threat: Artificial deadlines, power disconnect threats, account block/arrest threats.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Literal

ScamSubtype = Literal[
    "otp_pin_theft",
    "payment_fraud",
    "phishing",
    "impersonation",
    "urgency_threat",
]


@dataclass
class EvidenceMatch:
    subtype: ScamSubtype
    title: str
    evidence: str
    explanation: str


# Regex patterns with capturing groups for evidence extraction
OTP_PIN_PATTERNS = [
    (
        re.compile(r"\b(enter|share|send|forward|submit|give|tell)\b.{0,30}\b(otp|pin|upi\s*pin|mpin|cvv|password)\b", re.I),
        "Request to share confidential OTP or PIN",
        "Banks, genuine merchants, and payment apps never ask you to share your OTP or PIN.",
    ),
    (
        re.compile(r"\b(otp|pin)\b.{0,30}\b(to\s+(receive|claim|cancel|unblock|verify))\b", re.I),
        "Misleading PIN/OTP request for receiving funds or unblocking account",
        "You never need to enter or share a PIN or OTP to receive money.",
    ),
    (
        re.compile(r"\b(upi\s*pin|mpin|atm\s*pin)\b", re.I),
        "Reference to UPI PIN / ATM PIN",
        "Your UPI PIN is strictly for authorizing outgoing payments from your bank account.",
    ),
]

PAYMENT_FRAUD_PATTERNS = [
    (
        re.compile(r"\b(accidentally|mistakenly)\s+(sent|transferred|credited)\b.{0,80}\b(refund|return|approve|qr)\b", re.I),
        "Reverse refund trap",
        "Scammers claim accidental transfers and ask you to approve a request or scan a QR code to return it.",
    ),
    (
        re.compile(r"\b(cashback|reward|won|lottery|lucky\s*draw|kbc|prize)\b.{0,60}\b(claim|deposit|processing\s*fee|receive)\b", re.I),
        "Cashback / Lottery prize scam",
        "Legitimate cashback is credited directly to your bank account without fees or PIN entry.",
    ),
    (
        re.compile(r"\b(part\s*time\s*job|earn\s*rs|like\s*youtube|telegram|rating\s*hotels)\b", re.I),
        "Part-time job / Task investment scam",
        "High daily returns for simple social media tasks are fraudulent bait leading to advance-fee demands.",
    ),
    (
        re.compile(r"\b(enter\s*upi\s*pin|scan\s*(this\s*)?qr)\b.{0,80}\b(receive|get\s*money|claim|refund|return)\b", re.I),
        "Receive-money QR or PIN deception",
        "Scanning a QR or entering a PIN always sends money, it never receives money.",
    ),
]

PHISHING_PATTERNS = [
    (
        re.compile(r"https?://[^\s/$.?#].[^\s]*\.(top|site|xyz|online|cc|vip|club|apk|ru|tk|ml|ga|cf|gq|work|rest)\b[^\s]*", re.I),
        "Suspicious or unverified domain extension",
        "Scammers use inexpensive or deceptive top-level domains to host phishing pages.",
    ),
    (
        re.compile(r"\b(bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|goo\.gl|rb\.gy)/[a-zA-Z0-9_-]+", re.I),
        "Shortened URL concealing actual destination",
        "Shortened links obscure the destination address and are frequently used in SMS phishing.",
    ),
    (
        re.compile(r"\b[a-zA-Z0-9_-]+\.apk\b", re.I),
        "Unauthorized Android APK download",
        "Installing APKs outside Google Play exposes your device to malware and SMS interception.",
    ),
    (
        re.compile(r"\b(quicksupport|anydesk|teamviewer|rustdesk)\b", re.I),
        "Remote screen-sharing tool request",
        "Fraudsters use remote desktop applications to view your screen, intercept OTPs, and steal funds.",
    ),
]

IMPERSONATION_PATTERNS = [
    (
        re.compile(r"\b(sbi|hdfc|icici|axis|punjab\s*national|bank\s*manager|yono|paytm|phonepe|gpay)\b.{0,40}\b(suspended|blocked|kyc|expired|hold|officer)\b", re.I),
        "Bank / Payment service provider impersonation",
        "Fraudsters pose as official bank staff or payment apps claiming your account is blocked.",
    ),
    (
        re.compile(r"\b(electricity\s*(power|office|officer|bill)|power\s*will\s*be\s*disconnected)\b", re.I),
        "Electricity department impersonation",
        "Impersonators threaten power disconnection to coerce immediate payments or malicious app downloads.",
    ),
    (
        re.compile(r"\b(cbi|customs|mumbai\s*police|police\s*notice|narcotics|arrest|illegal\s*courier|fedex)\b", re.I),
        "Law enforcement / Digital arrest intimidation",
        "Law enforcement agencies and customs never issue arrest warrants or demand payment via SMS or WhatsApp.",
    ),
    (
        re.compile(r"\b(income\s*tax|tax\s*refund|pan\s*card\s*(not\s*linked|link))\b", re.I),
        "Tax authority / PAN linking impersonation",
        "Official tax refunds are processed via the official Income Tax portal, never via external third-party links.",
    ),
]

URGENCY_THREAT_PATTERNS = [
    (
        re.compile(r"\b(immediately|right\s*now|within\s*\d+\s*(hours?|minutes?|hrs?|mins?)|tonight\s*at|today)\b.{0,60}\b(disconnected|blocked|suspended|deactivated|arrest)\b", re.I),
        "Urgent threat of service termination or arrest",
        "Fraudsters manufacture high urgency to panic victims before they can verify with family or officials.",
    ),
    (
        re.compile(r"\b(disconnected|blocked|suspended|deactivated|arrest)\b.{0,60}\b(tonight|immediately|today|in\s*\d+\s*(hours?|minutes?|hrs?|mins?)|within|right\s*now)\b", re.I),
        "Urgent threat of service termination or arrest",
        "Fraudsters manufacture high urgency to panic victims before they can verify with family or officials.",
    ),
    (
        re.compile(r"\b(last\s*warning|final\s*warning|avoid\s*arrest|legal\s*action)\b", re.I),
        "Intimidation and coercive pressure",
        "High-pressure ultimatums are a trademark characteristic of social engineering and coercion scams.",
    ),
]



def extract_evidence_and_subtypes(text: str) -> tuple[list[ScamSubtype], list[EvidenceMatch]]:
    """Scan text for concrete, explainable evidence across scam subtypes."""
    detected_subtypes: set[ScamSubtype] = set()
    matches: list[EvidenceMatch] = []

    # 1. OTP / PIN theft
    for pattern, title, expl in OTP_PIN_PATTERNS:
        m = pattern.search(text)
        if m:
            detected_subtypes.add("otp_pin_theft")
            matches.append(
                EvidenceMatch(
                    subtype="otp_pin_theft",
                    title=title,
                    evidence=m.group(0),
                    explanation=expl,
                )
            )

    # 2. Payment fraud
    for pattern, title, expl in PAYMENT_FRAUD_PATTERNS:
        m = pattern.search(text)
        if m:
            detected_subtypes.add("payment_fraud")
            matches.append(
                EvidenceMatch(
                    subtype="payment_fraud",
                    title=title,
                    evidence=m.group(0),
                    explanation=expl,
                )
            )

    # 3. Phishing
    for pattern, title, expl in PHISHING_PATTERNS:
        m = pattern.search(text)
        if m:
            detected_subtypes.add("phishing")
            matches.append(
                EvidenceMatch(
                    subtype="phishing",
                    title=title,
                    evidence=m.group(0),
                    explanation=expl,
                )
            )

    # 4. Impersonation
    for pattern, title, expl in IMPERSONATION_PATTERNS:
        m = pattern.search(text)
        if m:
            detected_subtypes.add("impersonation")
            matches.append(
                EvidenceMatch(
                    subtype="impersonation",
                    title=title,
                    evidence=m.group(0),
                    explanation=expl,
                )
            )

    # 5. Urgency / Threat
    for pattern, title, expl in URGENCY_THREAT_PATTERNS:
        m = pattern.search(text)
        if m:
            detected_subtypes.add("urgency_threat")
            matches.append(
                EvidenceMatch(
                    subtype="urgency_threat",
                    title=title,
                    evidence=m.group(0),
                    explanation=expl,
                )
            )

    # Order subtypes deterministically
    ordered_subtypes = [
        s
        for s in ["otp_pin_theft", "payment_fraud", "phishing", "impersonation", "urgency_threat"]
        if s in detected_subtypes
    ]
    return ordered_subtypes, matches
