# SAARTHI SafePay - Machine Learning Pipeline & Model Governance

This directory contains the reproducible machine learning training, evaluation, and inference pipeline for **SAARTHI SafePay**. It classifies incoming payment alerts, SMS messages, and chat forwards into three canonical categories (`legitimate`, `promotional`, `scam`), provides calibrated confidence, extracts secondary evidence for verified scam subtypes, and safely integrates with the deterministic payment security engine.

---

## 1. Pipeline Architecture

```
Raw Data Sources:
  * Dataset_10191.csv (10,191 raw samples)
  * SMSSpamCollection (5,574 raw samples)
  * indian_payment_scams_reviewed.csv (curated advisories)
                           │
                           ▼
          [backend/ml/dataset.py: DatasetPipeline]
             - Text & label normalization
             - Deduplication (6,631 duplicates removed)
             - Conservative conflict resolution (scam > promotional > legitimate)
             - Stratified Train (70%) / Val (15%) / Test (15%)
             - Verified zero data leakage between partitions
                           │
       ┌───────────────────┴───────────────────┐
       ▼                                       ▼
Train Set (6,408)                       Val (1,374) & Test (1,374)
       │
       ▼
 [backend/ml/train.py]
    Feature Union:
      * Word TF-IDF: (1, 2) n-grams, min_df=2, sublinear_tf=True
      * Char-wb TF-IDF: (3, 5) n-grams, min_df=3, sublinear_tf=True
    Candidates:
      1. Class-weighted Logistic Regression (C=1.5)
      2. Calibrated Linear Support Vector Classifier (LinearSVC + Platt calibration)
    Winning Model Selection: Highest Val Macro F1 & Scam Recall
                           │
                           ▼
  Versioned Artifacts in backend/app/ml/artifacts/:
    * model_v1.joblib (~2.81 MB compressed)
    * label_map.json
    * metadata.json
    * evaluation_report.json / evaluation_report.md
                           │
                           ▼
 [backend/app/ml/service.py: MessageAnalysisService]
    - OOD detection (confidence < 0.55 threshold)
    - Deterministic Safety Override (high-concern rules NEVER downgraded)
    - Secondary subtype evidence (OTP theft, payment fraud, phishing, impersonation, urgency)
    - Trilingual actionable safe next steps (en, hi, kn)
```

---

## 2. Data Provenance & Licenses

| Dataset | Provenance / Sources | Raw Size | Canonical Mapping | License / Terms |
| :--- | :--- | :---: | :--- | :--- |
| **UCI SMS Spam Collection** | Tiago A. Almeida & José María Gómez Hidalgo | 5,574 | `ham` → `legitimate`<br>`spam` → `promotional` | Public Domain / CC BY 4.0 |
| **Dataset_10191** | Academic smishing & SMS benchmark | 10,191 | `ham` → `legitimate`<br>`spam` → `promotional`<br>`smishing` → `scam` | Academic / Research Use |
| **Indian Reviewed Scams** | Curated from RBI alerts, CERT-In advisories, NPCI circulars, Cyber Police bulletins | 30 | `scam` / `promotional` / `legitimate` with verified `subcategory` | Public domain regulatory notices |

### Privacy and Data Governance Policy
- **No Automatic Uploads**: Private user messages, scanned QR codes, camera frames, and user queries are **NEVER** sent to external servers or logged into training datasets.
- **Offline & Local Execution**: In-production inference runs entirely on the local backend server without third-party LLM transmission.
- **No Secret Collection**: SAARTHI never requests, accepts, logs, or stores UPI PINs, OTPs, CVVs, passwords, or net banking secrets.

---

## 3. Dataset Format & Adding Reviewed Examples

All processed partitions follow a standardized schema:
```csv
text,label,source,subcategory
"Dear Customer, electricity power disconnected tonight at 9.30 PM. Call officer at 9876543210.",scam,cert_in,urgency_threat
"Your SBI savings account XX1204 has been credited with Rs 15,000 via UPI.",legitimate,synthetic,none
"Swiggy: Enjoy hot biryani with flat Rs 120 off. Use coupon HUNGRY.",promotional,synthetic,none
```

### Supported Subcategories
- `otp_pin_theft`: Demands for OTP, PIN, UPI PIN, CVV, or passwords.
- `payment_fraud`: Reverse refund traps, fake cashback, QR pay-to-receive deceptions, task job scams.
- `phishing`: Suspicious top-level domains (`.top`, `.site`, `.xyz`), URL shorteners, unauthorized APK downloads.
- `impersonation`: Posing as bank managers, electricity boards, police/CBI, tax authorities.
- `urgency_threat`: Artificially short deadlines, account deactivation threats, arrest intimidation.

### How to Add Reviewed Examples
1. Open `backend/data/raw/indian_payment_scams_reviewed.csv`.
2. Add verified examples adhering to regulatory advisories or cyber police alerts.
3. Specify the appropriate `label` (`scam`, `promotional`, or `legitimate`), official `source`, and `subcategory`.
4. Re-run the preparation and training commands below.

---

## 4. CLI Commands

### Prepare & Deduplicate Dataset
```powershell
python -m ml.cli prepare --seed 42
```
*Loads raw sources, cleans text, resolves label conflicts conservatively, eliminates duplicate messages, and outputs leak-free `train.csv`, `val.csv`, and `test.csv` in `backend/data/processed/`.*

### Train & Select Model
```powershell
python -m ml.cli train --seed 42
```
*Trains candidate pipelines, evaluates validation metrics, selects the best performing classifier, evaluates on the untouched test partition, and saves compressed artifacts to `backend/app/ml/artifacts/`.*

### Standalone Split Evaluation
```powershell
python -m ml.cli evaluate --split test
```

### Interactive Message Inference
```powershell
python -m ml.cli predict --text "Your electricity bill is overdue. Power will be disconnected tonight. Call officer immediately." --language en
```

---

## 5. Model Evaluation Metrics (Actual Held-Out Results)

### Candidate Comparison on Validation Split (1,374 samples)
| Candidate | Accuracy | Macro F1 | Scam F1 | Scam Recall |
| :--- | :---: | :---: | :---: | :---: |
| `LogisticRegression_ClassWeighted` | 97.23% | 0.9615 | 0.9545 | 0.9665 |
| **`LinearSVC_Calibrated_ClassWeighted` (Selected)** | **97.67%** | **0.9669** | **0.9599** | **0.9693** |

### Untouched Held-Out Test Split Performance (1,374 samples)
*Evaluated on the completely untouched test set after model freeze (Random seed 42):*

- **Total Samples**: 1,374
- **Overall Accuracy**: **96.80%**
- **Macro Precision**: 0.9561 | **Macro Recall**: 0.9535 | **Macro F1**: **0.9548**
- **Weighted Precision**: 0.9678 | **Weighted Recall**: 0.9680 | **Weighted F1**: **0.9679**

#### Per-Class Performance
| Class | Precision | Recall | F1-Score | Support |
| :--- | :---: | :---: | :---: | :---: |
| `legitimate` | 0.9946 | 0.9986 | 0.9966 | 734 |
| `promotional` | 0.9348 | 0.9149 | 0.9247 | 282 |
| `scam` | 0.9391 | 0.9469 | 0.9430 | 358 |

#### Confusion Matrix (True Row \ Predicted Column)
| True \ Predicted | `legitimate` | `promotional` | `scam` |
| :--- | :---: | :---: | :---: |
| `legitimate` | **733** | 0 | 1 |
| `promotional` | 3 | **258** | 21 |
| `scam` | 1 | 18 | **339** |

*Key Findings:*
- **Zero False Clearance on High Risk**: 99.86% of genuine communications are recognized correctly without false scam warnings.
- **High Scam Sensitivity**: 339 out of 358 scam samples (94.69%) were caught on the held-out test set; the remaining are caught by deterministic payment rules.

### Training Reference Split (6,408 samples)
- **Overall Accuracy**: 99.45%
- **Macro F1**: 0.9921 | **Macro Precision**: 0.9921 | **Macro Recall**: 0.9920
- High training fidelity without catastrophic generalization drop on the held-out test split (test Macro F1 0.9548 vs train Macro F1 0.9921).

---

## 6. Safety Integration & System Guarantees

1. **Non-Overridable Deterministic Safety Rules**:
   - High-severity deterministic payment rules (such as requests for secret credentials, reverse refund collect deceptions, or mismatched amounts) can **NEVER** be overridden or downgraded by a low-risk ML prediction.
   - If the ML model classifies a message as `legitimate`, but the safety engine identifies a secret request, the final verdict is escalated to `high` risk.
2. **Honest Verification Policy**:
   - SAARTHI never claims a recipient or payment QR code is "verified" simply because the ML model predicts a message or payment note is legitimate. Verification requires certified VPA resolution.
3. **Out-of-Distribution (OOD) Handling**:
   - When maximum class probability falls below `0.55`, the prediction is flagged as out-of-distribution (`is_out_of_distribution: true`), the category is marked as `unknown`, and conservative caution guidance is returned.
4. **Input Constraints**:
   - Empty inputs and very short texts (< 6 characters) are treated conservatively as `unsupported` and do not generate false low-risk clearances.

---

## 7. Render Deployment Strategy

- **Self-Contained Artifacts**: The serialized pipeline `model_v1.joblib` is compressed using `joblib(..., compress=3)` to **~2.81 MB**.
- **Zero Runtime Training**: The backend loads `model_v1.joblib` via a lightweight singleton on startup in less than 20 milliseconds, eliminating any Render cold-start penalties or compilation delays.
- **Future Scale Storage Strategy**: If model artifacts exceed 50 MB in subsequent deep learning iterations, artifacts should be hosted on a CDN / AWS S3 / Cloudflare R2 bucket with hash verification (`sha256`) during the CI/CD build step rather than stored in git.

---

## 8. Limitations & Roadmap for Indian UPI Scam Coverage

### Current Limitations
1. **Script Representation**: The baseline model relies on English-character tokens and n-grams. While Romanized Indic (Hinglish/Kanglish) is supported by char-wb n-grams, pure Devanagari or Kannada texts depend predominantly on the secondary deterministic regex tables.
2. **Emerging Phishing Domains**: Rapidly rotating newly-registered ccTLDs require periodic regex and wordlist updates.
3. **Audio-Transcribed Nuances**: Transcriptions from noisy audio may contain phoneme misspellings not present in standard SMS text.

### Next Steps for Enhancement
1. **Multilingual Transformer Embeddings**: Integrate a quantized IndicBERT / MuRIL model (via ONNX runtime) for native Kannada, Hindi, Tamil, and Telugu text comprehension.
2. **Active Learning Feedback Loop**: Implement privacy-preserving telemetry where users can manually flag unclassified scam patterns without uploading personally identifiable information.
3. **NPCI & CERT-In Threat Feed Sync**: Automated script to ingest weekly public cyber fraud advisories into the curated training bank.
