"""Unit tests for the deterministic payment-safety engine."""

from __future__ import annotations

from urllib.parse import quote

from app.engine import RULE_ORDER, analyze_payment, extract_payment_info
from app.localization import STRINGS

CLEAN_QR = (
    "upi://pay?pa=green.kiran@okhdfcbank&pn=Green%20Kiran%20Stores"
    "&am=250&cu=INR&tn=Kirana%20groceries"
)
WRONG_AMOUNT_QR = (
    "upi://pay?pa=lucky.offer@okaxis&pn=Lucky%20Offer%20Store&am=5000"
    "&cu=INR&tn=Prize%20fee"
)
SECRET_MESSAGE = (
    "Your bank account will be blocked today. Share your OTP and UPI PIN "
    "immediately to keep it active."
)
REMINDER_MESSAGE = "Never share your UPI PIN or OTP with anyone."
NO_AMOUNT_QR = "upi://pay?pa=ramesh.verifiers@oksbi&pn=Ramesh"


def _ids(result: dict) -> list[str]:
    return [sign["id"] for sign in result["warning_signs"]]


def test_clean_qr_is_low_concern() -> None:
    result = analyze_payment(CLEAN_QR, "pay", 250, "en")
    assert result["outcome"] == "low_concern"
    assert result["warning_signs"] == []
    assert result["extracted"]["payee_vpa"] == "green.kiran@okhdfcbank"
    assert result["extracted"]["payee_name"] == "Green Kiran Stores"
    assert result["extracted"]["amount"] == 250
    assert result["extracted"]["supported"] is True
    assert result["ai_overrode_engine"] is False
    assert "not a safety guarantee" in result["explanation"]


def test_amount_mismatch_is_high_concern() -> None:
    result = analyze_payment(WRONG_AMOUNT_QR, "pay", 500, "en")
    assert result["outcome"] == "high_concern"
    assert _ids(result) == ["AMOUNT_MISMATCH"]
    detail = result["warning_signs"][0]["detail"]
    assert "₹5,000" in detail and "₹500" in detail


def test_secret_request_and_urgency_are_high_concern() -> None:
    result = analyze_payment(SECRET_MESSAGE, "pay", None, "en")
    assert result["outcome"] == "high_concern"
    ids = _ids(result)
    assert "SECRET_REQUEST" in ids
    assert "URGENCY_PRESSURE" in ids
    # No payment information was readable -> still high (safety first).
    assert result["extracted"]["supported"] is False


def test_safety_reminder_is_not_flagged_as_secret_request() -> None:
    result = analyze_payment(REMINDER_MESSAGE, "pay", None, "en")
    assert "SECRET_REQUEST" not in _ids(result)
    assert result["outcome"] == "unable_to_verify"


def test_intent_mismatch_when_user_wants_to_receive() -> None:
    message = (
        "Congratulations! You will receive Rs. 2,000. Scan this QR to receive "
        "money: upi://pay?pa=winner.claim@ybl&pn=Prize%20Desk&am=2000&cu=INR"
    )
    result = analyze_payment(message, "receive", None, "en")
    assert result["outcome"] == "high_concern"
    assert "INTENT_MISMATCH" in _ids(result)
    detail = next(s["detail"] for s in result["warning_signs"] if s["id"] == "INTENT_MISMATCH")
    assert "FROM your account" in detail


def test_intent_mismatch_when_message_claims_money_arrives() -> None:
    message = (
        "You will receive Rs. 2,000 today. Scan: "
        "upi://pay?pa=winner.claim@ybl&am=100&cu=INR"
    )
    result = analyze_payment(message, "pay", None, "en")
    assert result["outcome"] == "high_concern"
    detail = next(s["detail"] for s in result["warning_signs"] if s["id"] == "INTENT_MISMATCH")
    assert "says you will receive money" in detail


def test_website_link_is_unable_to_verify() -> None:
    result = analyze_payment("https://bit.ly/claim-prize-now", "pay", None, "en")
    assert result["outcome"] == "unable_to_verify"
    assert "UNSUPPORTED_INFO" in _ids(result)
    assert result["insufficient_reasons"]


def test_missing_amount_is_be_careful() -> None:
    result = analyze_payment(NO_AMOUNT_QR, "pay", 1500, "en")
    assert result["outcome"] == "be_careful"
    assert "AMOUNT_NOT_SHOWN" in _ids(result)
    detail = next(s["detail"] for s in result["warning_signs"] if s["id"] == "AMOUNT_NOT_SHOWN")
    assert "₹1,500" in detail


def test_invalid_payee_is_unable_to_verify() -> None:
    result = analyze_payment("upi://pay?pa=not_a_valid_id&pn=Test", "pay", None, "en")
    assert result["outcome"] == "unable_to_verify"
    assert _ids(result) == ["INVALID_VPA"]


def test_unusually_large_amount_is_be_careful() -> None:
    qr = "upi://pay?pa=big.store@oksbi&pn=Big%20Store&am=150000&cu=INR"
    result = analyze_payment(qr, "pay", None, "en")
    assert result["outcome"] == "be_careful"
    assert "AMOUNT_HIGH" in _ids(result)
    detail = next(s["detail"] for s in result["warning_signs"] if s["id"] == "AMOUNT_HIGH")
    assert "₹150,000" in detail


def test_unknown_intent_is_be_careful() -> None:
    result = analyze_payment(CLEAN_QR, "unknown", 250, "en")
    assert result["outcome"] == "be_careful"
    assert _ids(result) == ["INTENT_UNKNOWN"]


def test_hindi_urgency_is_detected_in_hindi() -> None:
    text = "तुरंत अपना खाता सत्यापित करें नहीं तो खाता ब्लॉक हो जाएगा"
    result = analyze_payment(text, "pay", None, "hi")
    assert result["outcome"] == "high_concern"
    assert "URGENCY_PRESSURE" in _ids(result)
    assert "{" not in result["explanation"]


def test_kannada_secret_request_is_detected() -> None:
    text = "ತಕ್ಷಣ ನಿಮ್ಮ ಒಟಿಪಿ ಮತ್ತು ಪಿನ್ ಕಳುಹಿಸಿ, ಇಲ್ಲದಿದ್ದರೆ ಖಾತೆ ನಿರ್ಬಂಧ"
    result = analyze_payment(text, "pay", None, "kn")
    assert result["outcome"] == "high_concern"
    ids = _ids(result)
    assert "SECRET_REQUEST" in ids
    assert "URGENCY_PRESSURE" in ids
    assert "{" not in result["explanation"]


def test_every_outcome_has_full_translations() -> None:
    outcomes = ("low_concern", "be_careful", "high_concern", "unable_to_verify")
    for language, table in STRINGS.items():
        for outcome in outcomes:
            entry = table["outcomes"][outcome]
            assert entry["label"].strip(), (language, outcome)
            assert entry["summary"].strip(), (language, outcome)
            assert entry["explanation"].strip(), (language, outcome)
            assert table["actions"][outcome], (language, outcome)
        for rule_id in RULE_ORDER:
            rule = table["rules"][rule_id]
            assert rule["title"].strip(), (language, rule_id)
            assert rule["detail"].strip(), (language, rule_id)
        assert table["disclaimer"].strip()


def test_result_is_always_localised_and_complete() -> None:
    for language in ("en", "hi", "kn"):
        result = analyze_payment(CLEAN_QR, "pay", 250, language)
        assert result["language"] == language
        assert result["outcome_label"].strip()
        assert "{" not in result["explanation"] and "}" not in result["explanation"]
        assert result["recommended_actions"]
        assert result["disclaimer"].strip()
        assert result["ai_overrode_engine"] is False


def test_checks_cover_every_rule() -> None:
    result = analyze_payment(CLEAN_QR, "pay", 250, "en")
    assert [check["id"] for check in result["checks"]] == RULE_ORDER
    valid = {"triggered", "clear", "not_applicable"}
    assert all(check["status"] in valid for check in result["checks"])
    assert set(result["status_labels"]) == valid


def test_extracts_from_percent_encoded_payload() -> None:
    encoded = quote(CLEAN_QR, safe="")
    info = extract_payment_info(encoded)
    assert info.kind == "upi_pay"
    assert info.supported is True
    assert info.amount == 250


def test_extracts_from_typed_payload_with_spaces() -> None:
    info = extract_payment_info("upi://pay?pa=ramesh@oksbi&pn=Prize Desk&am=100")
    assert info.payee_vpa == "ramesh@oksbi"
    assert info.payee_name == "Prize Desk"
    assert info.amount == 100


def test_extracts_bare_vpa_and_text_amount() -> None:
    bare = extract_payment_info("9876543210@ybl")
    assert bare.kind == "vpa" and bare.supported is True

    message = extract_payment_info("Pay Rs. 450 to ramesh@oksbi today")
    assert message.kind == "vpa"
    assert message.amount == 450
    assert message.amount_source == "text"


def test_empty_input_is_unable_to_verify() -> None:
    result = analyze_payment("   ", "pay", None, "en")
    assert result["outcome"] == "unable_to_verify"
    assert result["extracted"]["supported"] is False


def test_urdu_secret_and_urgency_detected() -> None:
    urdu_msg = "فوری طور پر اپنا او ٹی پی اور پن بتائیں ورنہ اکاؤنٹ بلاک ہو جائے گا"
    result = analyze_payment(urdu_msg, "pay", None, "ur")
    assert result["outcome"] == "high_concern"
    ids = _ids(result)
    assert "SECRET_REQUEST" in ids
    assert "URGENCY_PRESSURE" in ids
    assert result["language"] == "ur"


def test_urdu_clean_qr_localized() -> None:
    result = analyze_payment(CLEAN_QR, "pay", 250, "ur")
    assert result["outcome"] == "low_concern"
    assert result["language"] == "ur"
    assert result["outcome_label"] == "کم تشویش"
    assert "حفاظت کی مکمل ضمانت" in result["disclaimer"]


def test_urdu_reminder_not_flagged_as_secret() -> None:
    reminder = "اپنا UPI پن یا او ٹی پی کسی کو نہ بتائیں"
    result = analyze_payment(reminder, "pay", None, "ur")
    assert "SECRET_REQUEST" not in _ids(result)

