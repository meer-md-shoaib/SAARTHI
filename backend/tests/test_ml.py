"""Comprehensive unit and integration tests for SAARTHI SafePay ML pipeline."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ml.classifier import get_message_classifier
from app.ml.service import get_message_analysis_service
from app.ml.subcategories import extract_evidence_and_subtypes
from ml.dataset import DatasetPipeline, DatasetSample, normalize_text_for_dedup
from ml.evaluate import compute_metrics


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# --- 1. Dataset Cleaning, Deduplication & Leakage Prevention ---


def test_normalize_text_for_dedup():
    raw1 = "  Dear   Customer,  your electricity bill is pending! \n"
    raw2 = "dear customer, your electricity bill is pending!"
    assert normalize_text_for_dedup(raw1) == normalize_text_for_dedup(raw2)


def test_dataset_deduplication_and_conflict_resolution():
    pipeline = DatasetPipeline()
    samples = [
        DatasetSample("Win a prize now", "Win a prize now", "promotional", "s1"),
        DatasetSample("win a prize now", "win a prize now", "scam", "s2"),  # conflict: scam should win
        DatasetSample("Hello mom", "Hello mom", "legitimate", "s3"),
        DatasetSample("hello mom ", "hello mom ", "legitimate", "s4"),  # duplicate
    ]
    deduped, stats = pipeline.process_and_deduplicate(samples)
    assert len(deduped) == 2
    assert stats["duplicates_dropped"] == 2
    assert stats["conflicts_resolved"] == 1

    by_text = {s.clean_text.lower().strip(): s.label for s in deduped}
    assert by_text["win a prize now"] == "scam"
    assert by_text["hello mom"] == "legitimate"


def test_dataset_split_has_zero_leakage():
    pipeline = DatasetPipeline(random_state=42)
    # Generate mock sample list
    mock_samples = []
    for i in range(100):
        mock_samples.append(
            DatasetSample(f"Message number {i} for testing", f"Message number {i} for testing", "legitimate" if i < 60 else "scam", "mock")
        )
    train, val, test = pipeline.split_dataset(mock_samples, train_ratio=0.7, val_ratio=0.15)

    train_keys = {normalize_text_for_dedup(s.raw_text) for s in train}
    val_keys = {normalize_text_for_dedup(s.raw_text) for s in val}
    test_keys = {normalize_text_for_dedup(s.raw_text) for s in test}

    assert len(train_keys.intersection(val_keys)) == 0
    assert len(train_keys.intersection(test_keys)) == 0
    assert len(val_keys.intersection(test_keys)) == 0


# --- 2. Model Classifier & Artifact Integrity ---


def test_classifier_is_loaded_and_predicts():
    classifier = get_message_classifier()
    assert classifier.is_ready is True
    assert classifier.model_version == "1.0.0"

    pred = classifier.predict("Congratulations! You won Rs 50,000 lottery. Click here to claim.")
    assert pred.predicted_category in ("scam", "promotional", "legitimate")
    assert 0.0 <= pred.confidence <= 1.0
    assert "scam" in pred.class_probabilities
    assert "legitimate" in pred.class_probabilities
    assert "promotional" in pred.class_probabilities


def test_compute_metrics_accuracy():
    y_true = ["legitimate", "scam", "promotional", "scam"]
    y_pred = ["legitimate", "scam", "promotional", "legitimate"]
    labels = ["legitimate", "promotional", "scam"]
    metrics = compute_metrics(y_true, y_pred, labels=labels, split_name="test")

    assert metrics["accuracy"] == 0.75
    assert metrics["per_class"]["promotional"]["precision"] == 1.0
    assert metrics["confusion_matrix"]["counts"] == [
        [1, 0, 0],
        [0, 1, 0],
        [1, 0, 1],
    ]


# --- 3. Secondary Subtypes & Evidence Extraction ---


def test_evidence_extraction_otp_pin_theft():
    text = "Dear user, share your 6-digit OTP right now to unblock your account."
    subtypes, matches = extract_evidence_and_subtypes(text)
    assert "otp_pin_theft" in subtypes
    assert any("OTP" in m.title or "share" in m.evidence.lower() for m in matches)


def test_evidence_extraction_payment_fraud():
    text = "Accidentally sent Rs 5000 to your PhonePe account. Please scan this QR to refund."
    subtypes, matches = extract_evidence_and_subtypes(text)
    assert "payment_fraud" in subtypes


def test_evidence_extraction_phishing():
    text = "Your bank KYC is expired. Download sbi-update.apk or visit http://bank-update.top to update PAN."
    subtypes, matches = extract_evidence_and_subtypes(text)
    assert "phishing" in subtypes


def test_evidence_extraction_impersonation_and_urgency():
    text = "Electricity officer notice: power will be disconnected tonight at 9.30 PM immediately."
    subtypes, matches = extract_evidence_and_subtypes(text)
    assert "impersonation" in subtypes
    assert "urgency_threat" in subtypes


# --- 4. Service Safety Engine Integration & Conservative Fallback ---


def test_service_empty_input_handling():
    service = get_message_analysis_service()
    res = service.analyze_message("")
    assert res["category"] == "unsupported"
    assert res["risk_level"] == "unknown"
    assert res["is_out_of_distribution"] is True
    assert len(res["safe_next_steps"]) > 0


def test_service_very_short_input_handling():
    service = get_message_analysis_service()
    res = service.analyze_message("hi")
    assert res["category"] == "unsupported"
    assert res["risk_level"] == "unknown"
    assert "too short" in res["explanation"].lower()


def test_service_high_risk_rule_cannot_be_overridden_by_low_risk_ml():
    """Even if an input somehow has low ML scam score, a secret request must trigger high risk."""
    service = get_message_analysis_service()
    # Message disguised as innocent with a secret request inside
    tricky_text = "Good morning friend, please enter your UPI PIN to approve receipt of cash."
    res = service.analyze_message(tricky_text)
    assert res["risk_level"] == "high"
    assert "otp_pin_theft" in res["subcategories"] or res["safety_engine_override"] is True


def test_service_multilingual_advice():
    service = get_message_analysis_service()
    text = "Electricity bill overdue. Power disconnected in 1 hour."

    res_hi = service.analyze_message(text, language="hi")
    assert any("बिजली" in step or "पुष्टि" in step or "साझा" in step for step in res_hi["safe_next_steps"])

    res_kn = service.analyze_message(text, language="kn")
    assert any("ವಿದ್ಯುತ್" in step or "ಹಂಚಿಕೊಳ್ಳಬೇಡಿ" in step or "ಪರಿಶೀಲಿಸಿ" in step for step in res_kn["safe_next_steps"])


# --- 5. API Endpoints Integration ---


def test_api_analyze_message_scam(client: TestClient):
    payload = {
        "message": "Dear SBI Customer, your account is suspended. Click http://sbi-update.xyz to submit net banking password.",
        "language": "en",
    }
    response = client.post("/api/v1/analyze-message", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "scam"
    assert data["risk_level"] == "high"
    assert len(data["evidence"]) > 0
    assert len(data["safe_next_steps"]) > 0
    assert data["model_version"] == "1.0.0"


def test_api_analyze_message_legitimate(client: TestClient):
    payload = {
        "message": "Hi mom, I will arrive at the train station at 6 PM today. See you soon!",
        "language": "en",
    }
    response = client.post("/api/v1/analyze-message", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "legitimate"
    assert data["risk_level"] == "low"


def test_api_analyze_message_validation_error(client: TestClient):
    # Empty string should fail validation
    response = client.post("/api/v1/analyze-message", json={"message": "   "})
    assert response.status_code == 422


def test_ask_routes_suspicious_message_to_ml_analysis(client: TestClient):
    # Message format input sent to /api/v1/ask
    suspicious_msg = "URGENT: Your electricity power will be disconnected tonight at 9.30 PM. Call electricity officer immediately at 9876543210."
    response = client.post("/api/v1/ask", json={"text": suspicious_msg, "language": "en"})
    assert response.status_code == 200
    body = response.json()
    assert body["topic_id"] == "message_analysis"
    assert body["answered_by"] == "ml_message_analysis"
    assert "High Risk" in body["title"]
    assert "Safe Next Steps" in body["answer"]
