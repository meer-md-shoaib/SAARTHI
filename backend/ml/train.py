"""Model training and artifact serialization pipeline.

Trains practical baseline text classifiers:
- Feature Extraction: FeatureUnion of word (1, 2) n-grams and char_wb (3, 5) n-grams.
- Candidate Models:
    1. Class-weighted Logistic Regression (C=1.5)
    2. Calibrated Linear Support Vector Classifier (LinearSVC with 3-fold Platt calibration)
- Model Selection: Compares candidates on the validation set using Macro F1 and Scam Recall.
- Held-out Evaluation: Evaluates winning model on the untouched test partition.
- Serialization: Saves compressed pipeline, label mapping, and versioned metadata to backend/app/ml/artifacts.
"""

from __future__ import annotations

import csv
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import joblib
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import LinearSVC

from .dataset import CANONICAL_LABELS, DatasetPipeline
from .evaluate import compute_metrics, format_markdown_report

logger = logging.getLogger("saarthi.ml.train")

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "app" / "ml" / "artifacts"
MODEL_VERSION = "1.0.0"


def load_partition(path: Path) -> tuple[list[str], list[str]]:
    """Read a CSV partition and return (texts, labels)."""
    texts: list[str] = []
    labels: list[str] = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            t = (row.get("text") or "").strip()
            l = (row.get("label") or "").strip()
            if t and l:
                texts.append(t)
                labels.append(l)
    return texts, labels


def build_feature_extractor() -> FeatureUnion:
    """Build dual word and character n-gram TF-IDF feature extractor."""
    word_vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        min_df=2,
        max_df=0.98,
        sublinear_tf=True,
        token_pattern=r"(?u)\b\w+\b",
    )
    char_vectorizer = TfidfVectorizer(
        ngram_range=(3, 5),
        analyzer="char_wb",
        min_df=3,
        max_df=0.98,
        sublinear_tf=True,
    )
    return FeatureUnion(
        [
            ("word_tfidf", word_vectorizer),
            ("char_tfidf", char_vectorizer),
        ]
    )


def build_candidate_pipelines(random_state: int = 42) -> dict[str, Pipeline]:
    """Construct candidate classification pipelines."""
    # Candidate 1: Balanced Logistic Regression
    lr_pipeline = Pipeline(
        [
            ("features", build_feature_extractor()),
            (
                "clf",
                LogisticRegression(
                    C=1.5,
                    class_weight="balanced",
                    max_iter=1000,
                    random_state=random_state,
                    solver="lbfgs",
                ),
            ),
        ]
    )

    # Candidate 2: Calibrated Linear Support Vector Classifier (LinearSVC)
    svc_base = LinearSVC(
        C=1.0,
        class_weight="balanced",
        random_state=random_state,
        max_iter=2000,
    )
    calibrated_svc = CalibratedClassifierCV(estimator=svc_base, cv=3)

    svc_pipeline = Pipeline(
        [
            ("features", build_feature_extractor()),
            ("clf", calibrated_svc),
        ]
    )

    return {
        "LogisticRegression_ClassWeighted": lr_pipeline,
        "LinearSVC_Calibrated_ClassWeighted": svc_pipeline,
    }


def train_and_select_model(
    processed_dir: Path | None = None,
    artifacts_dir: Path | None = None,
    random_state: int = 42,
) -> dict[str, Any]:
    """Train candidates, compare on validation set, evaluate on test set, and serialize artifacts."""
    base = Path(__file__).resolve().parent.parent
    p_dir = processed_dir if processed_dir else base / "data" / "processed"
    a_dir = artifacts_dir if artifacts_dir else ARTIFACTS_DIR
    a_dir.mkdir(parents=True, exist_ok=True)

    # Ensure processed datasets exist
    train_csv = p_dir / "train.csv"
    val_csv = p_dir / "val.csv"
    test_csv = p_dir / "test.csv"

    if not (train_csv.is_file() and val_csv.is_file() and test_csv.is_file()):
        logger.info("Processed datasets not found. Running dataset preparation...")
        dp = DatasetPipeline(random_state=random_state)
        dp.run()

    # Load splits
    X_train, y_train = load_partition(train_csv)
    X_val, y_val = load_partition(val_csv)
    X_test, y_test = load_partition(test_csv)

    logger.info(
        "Loaded partitions: Train=%d, Val=%d, Test=%d",
        len(X_train),
        len(X_val),
        len(X_test),
    )

    candidates = build_candidate_pipelines(random_state=random_state)
    candidate_val_reports: dict[str, dict[str, Any]] = {}

    best_candidate_name: str | None = None
    best_val_score: float = -1.0
    best_pipeline: Pipeline | None = None

    labels = list(CANONICAL_LABELS)

    for name, pipeline in candidates.items():
        logger.info("Training candidate model: %s...", name)
        pipeline.fit(X_train, y_train)

        # Evaluate on validation set
        y_val_pred = pipeline.predict(X_val)
        val_metrics = compute_metrics(y_val, list(y_val_pred), labels=labels, split_name="validation")
        candidate_val_reports[name] = val_metrics

        macro_f1 = val_metrics["macro_metrics"]["f1_score"]
        scam_f1 = val_metrics["per_class"]["scam"]["f1_score"]
        # Score combines overall macro F1 with high priority on scam detection
        selection_score = 0.6 * macro_f1 + 0.4 * scam_f1

        logger.info(
            "Candidate %s -> Val Macro F1: %.4f, Scam F1: %.4f (Selection score: %.4f)",
            name,
            macro_f1,
            scam_f1,
            selection_score,
        )

        if selection_score > best_val_score:
            best_val_score = selection_score
            best_candidate_name = name
            best_pipeline = pipeline

    assert best_candidate_name is not None and best_pipeline is not None
    logger.info("Selected winning candidate: %s", best_candidate_name)

    # Genuine Held-Out Test Evaluation
    y_test_pred = best_pipeline.predict(X_test)
    test_metrics = compute_metrics(y_test, list(y_test_pred), labels=labels, split_name="held_out_test")

    # Train Evaluation for Overfitting Reference
    y_train_pred = best_pipeline.predict(X_train)
    train_metrics = compute_metrics(y_train, list(y_train_pred), labels=labels, split_name="train_reference")

    # Prepare Artifacts
    model_artifact_path = a_dir / f"model_v{MODEL_VERSION.split('.')[0]}.joblib"
    joblib.dump(best_pipeline, model_artifact_path, compress=3)
    logger.info("Model pipeline saved to %s (size: %d bytes)", model_artifact_path, model_artifact_path.stat().st_size)

    # Label map
    label_classes = list(best_pipeline.classes_)
    label_map = {
        "classes": label_classes,
        "class_to_idx": {cls: i for i, cls in enumerate(label_classes)},
        "idx_to_class": {i: cls for i, cls in enumerate(label_classes)},
    }
    with open(a_dir / "label_map.json", "w", encoding="utf-8") as f:
        json.dump(label_map, f, indent=2)

    # Metadata
    metadata = {
        "model_version": MODEL_VERSION,
        "artifact_file": model_artifact_path.name,
        "selected_architecture": best_candidate_name,
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "random_seed": random_state,
        "features": {
            "word_ngrams": [1, 2],
            "char_ngrams": [3, 5],
            "analyzer": "word + char_wb",
        },
        "classes": label_classes,
        "dataset_splits": {
            "train_samples": len(X_train),
            "val_samples": len(X_val),
            "test_samples": len(X_test),
        },
        "candidate_comparison": {
            k: {
                "macro_f1": v["macro_metrics"]["f1_score"],
                "scam_f1": v["per_class"]["scam"]["f1_score"],
                "accuracy": v["accuracy"],
            }
            for k, v in candidate_val_reports.items()
        },
        "held_out_test_metrics": {
            "accuracy": test_metrics["accuracy"],
            "macro_f1": test_metrics["macro_metrics"]["f1_score"],
            "scam_f1": test_metrics["per_class"]["scam"]["f1_score"],
            "scam_recall": test_metrics["per_class"]["scam"]["recall"],
            "scam_precision": test_metrics["per_class"]["scam"]["precision"],
        },
    }
    with open(a_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    # Full Evaluation Report
    full_report = {
        "metadata": metadata,
        "validation_comparison": candidate_val_reports,
        "train_metrics": train_metrics,
        "held_out_test_metrics": test_metrics,
    }
    with open(a_dir / "evaluation_report.json", "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2)

    # Markdown Report
    test_md = format_markdown_report(test_metrics, candidate_name=best_candidate_name)
    train_md = format_markdown_report(train_metrics, candidate_name=best_candidate_name)
    with open(a_dir / "evaluation_report.md", "w", encoding="utf-8") as f:
        f.write("# SAARTHI SafePay - Machine Learning Model Evaluation Report\n\n")
        f.write(f"- **Model Version**: {MODEL_VERSION}\n")
        f.write(f"- **Selected Pipeline**: `{best_candidate_name}`\n")
        f.write(f"- **Evaluation Timestamp**: {metadata['trained_at_utc']}\n\n")
        f.write("## Candidate Validation Comparison\n\n")
        f.write("| Candidate | Accuracy | Macro F1 | Scam F1 | Scam Recall |\n")
        f.write("| :--- | :---: | :---: | :---: | :---: |\n")
        for cname, creport in candidate_val_reports.items():
            f.write(
                f"| `{cname}` | {creport['accuracy']*100:.2f}% | "
                f"{creport['macro_metrics']['f1_score']:.4f} | "
                f"{creport['per_class']['scam']['f1_score']:.4f} | "
                f"{creport['per_class']['scam']['recall']:.4f} |\n"
            )
        f.write("\n## Held-out Test Set Results (Untouched Partition)\n\n")
        f.write(test_md)
        f.write("\n## Training Set Results (Generalization Baseline)\n\n")
        f.write(train_md)

    logger.info("Model training and evaluation successfully completed.")
    return full_report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    report = train_and_select_model()
    print("\n--- HELD-OUT TEST EVALUATION SUMMARY ---")
    print(json.dumps(report["held_out_test_metrics"]["macro_metrics"], indent=2))
    print("\n--- PER-CLASS TEST METRICS ---")
    print(json.dumps(report["held_out_test_metrics"]["per_class"], indent=2))
