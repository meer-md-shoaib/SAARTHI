"""Evaluation utilities for evaluating text classification models.

Calculates:
- Global accuracy, macro F1, weighted F1, macro precision, macro recall
- Per-class precision, recall, f1-score, support
- Confusion matrix (raw counts and row-normalized percentages)
- High-level markdown summary formatting
"""

from __future__ import annotations

from typing import Any
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, precision_recall_fscore_support


def compute_metrics(
    y_true: list[str],
    y_pred: list[str],
    labels: list[str],
    split_name: str = "test",
) -> dict[str, Any]:
    """Compute comprehensive evaluation metrics across specified labels."""
    acc = accuracy_score(y_true, y_pred)
    p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, average="macro", zero_division=0
    )
    p_weighted, r_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, average="weighted", zero_division=0
    )

    per_class_p, per_class_r, per_class_f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, average=None, zero_division=0
    )

    per_class_dict = {}
    for idx, label in enumerate(labels):
        per_class_dict[label] = {
            "precision": round(float(per_class_p[idx]), 4),
            "recall": round(float(per_class_r[idx]), 4),
            "f1_score": round(float(per_class_f1[idx]), 4),
            "support": int(support[idx]),
        }

    cm = confusion_matrix(y_true, y_pred, labels=labels)
    cm_list = cm.tolist()
    cm_norm = (cm.astype("float") / cm.sum(axis=1)[:, np.newaxis]).round(4).tolist()

    report_dict = classification_report(
        y_true, y_pred, labels=labels, output_dict=True, zero_division=0
    )

    return {
        "split": split_name,
        "sample_count": len(y_true),
        "accuracy": round(float(acc), 4),
        "macro_metrics": {
            "precision": round(float(p_macro), 4),
            "recall": round(float(r_macro), 4),
            "f1_score": round(float(f1_macro), 4),
        },
        "weighted_metrics": {
            "precision": round(float(p_weighted), 4),
            "recall": round(float(r_weighted), 4),
            "f1_score": round(float(f1_weighted), 4),
        },
        "per_class": per_class_dict,
        "confusion_matrix": {
            "labels": labels,
            "counts": cm_list,
            "normalized_rows": cm_norm,
        },
        "sklearn_classification_report": report_dict,
    }


def format_markdown_report(
    eval_result: dict[str, Any],
    candidate_name: str = "LogisticRegression",
) -> str:
    """Render a clean Markdown evaluation report from metrics dictionary."""
    lines = []
    split = eval_result.get("split", "Held-out Test Set")
    lines.append(f"### Evaluation Report: {candidate_name} ({split.title()})")
    lines.append("")
    lines.append(f"- **Total Samples**: {eval_result.get('sample_count', 0)}")
    lines.append(f"- **Overall Accuracy**: {eval_result.get('accuracy', 0.0) * 100:.2f}%")
    macro = eval_result.get("macro_metrics", {})
    weighted = eval_result.get("weighted_metrics", {})
    lines.append(
        f"- **Macro F1**: {macro.get('f1_score', 0):.4f} | "
        f"**Macro Precision**: {macro.get('precision', 0):.4f} | "
        f"**Macro Recall**: {macro.get('recall', 0):.4f}"
    )
    lines.append(
        f"- **Weighted F1**: {weighted.get('f1_score', 0):.4f} | "
        f"**Weighted Precision**: {weighted.get('precision', 0):.4f} | "
        f"**Weighted Recall**: {weighted.get('recall', 0):.4f}"
    )
    lines.append("")
    lines.append("#### Per-Class Performance")
    lines.append("")
    lines.append("| Class | Precision | Recall | F1-Score | Support |")
    lines.append("| :--- | :--- | :--- | :--- | :--- |")
    for cls_name, metrics in eval_result.get("per_class", {}).items():
        lines.append(
            f"| `{cls_name}` | {metrics['precision']:.4f} | {metrics['recall']:.4f} | "
            f"{metrics['f1_score']:.4f} | {metrics['support']} |"
        )
    lines.append("")
    lines.append("#### Confusion Matrix (True Row \\ Predicted Col)")
    lines.append("")
    cm_data = eval_result.get("confusion_matrix", {})
    labels = cm_data.get("labels", [])
    header = "| True \\ Pred | " + " | ".join(f"`{l}`" for l in labels) + " |"
    sep = "| :--- | " + " | ".join([":---:"] * len(labels)) + " |"
    lines.append(header)
    lines.append(sep)
    for i, row_label in enumerate(labels):
        row_vals = cm_data.get("counts", [])[i]
        vals_str = " | ".join(str(v) for v in row_vals)
        lines.append(f"| `{row_label}` | {vals_str} |")
    lines.append("")
    return "\n".join(lines)
