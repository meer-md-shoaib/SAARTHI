"""Dataset loading, cleaning, deduplication, and stratified splitting pipeline.

Features:
- Ingests multiple raw datasets (SMS Spam Collection, Dataset_10191, Reviewed Indian Scams).
- Cleans and normalizes text and labels into three canonical categories:
    * legitimate (non-fraudulent personal and transactional communications)
    * promotional (mass marketing, offers, advertisements)
    * scam (fraud, phishing, smishing, OTP/PIN theft, deceptive payment requests)
- Deduplicates samples before splitting to prevent train-test contamination.
- Resolves conflicting labels conservatively (scam > promotional > legitimate).
- Splits into stratified Train (70%), Validation (15%), and Test (15%) sets with fixed seeds.
- Verifies zero overlap between splits.
- Exports processed CSVs and a dataset summary report.
"""

from __future__ import annotations

import csv
import json
import logging
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from sklearn.model_selection import train_test_split

logger = logging.getLogger("saarthi.ml.dataset")

# Canonical 3-class target categories
CANONICAL_LABELS = ("legitimate", "promotional", "scam")

# Conflict resolution priority (safety-first ordering)
LABEL_PRIORITY = {
    "scam": 3,
    "promotional": 2,
    "legitimate": 1,
}

RAW_LABEL_MAPPING = {
    "ham": "legitimate",
    "legitimate": "legitimate",
    "spam": "promotional",
    "promotional": "promotional",
    "smishing": "scam",
    "scam": "scam",
    "fraud": "scam",
}


@dataclass
class DatasetSample:
    raw_text: str
    clean_text: str
    label: str
    source: str
    subcategory: str | None = None


def normalize_text_for_dedup(text: str) -> str:
    """Normalize text for duplicate and near-duplicate detection."""
    lowered = text.strip().lower()
    # Normalize excessive whitespace
    return re.sub(r"\s+", " ", lowered)


class DatasetPipeline:
    """End-to-end dataset preparation pipeline."""

    def __init__(
        self,
        raw_dir: str | Path | None = None,
        output_dir: str | Path | None = None,
        random_state: int = 42,
    ) -> None:
        base = Path(__file__).resolve().parent.parent
        self.raw_dir = Path(raw_dir) if raw_dir else base / "data" / "raw"
        self.output_dir = Path(output_dir) if output_dir else base / "data" / "processed"
        self.random_state = random_state

    def load_sms_spam_collection(self) -> list[DatasetSample]:
        """Load UCI SMS Spam Collection (tab-separated, no header)."""
        filepath = self.raw_dir / "SMSSpamCollection"
        samples: list[DatasetSample] = []
        if not filepath.is_file():
            logger.warning("SMSSpamCollection not found at %s", filepath)
            return samples

        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            for line_idx, line in enumerate(f):
                parts = line.strip().split("\t", 1)
                if len(parts) == 2:
                    raw_label, text = parts
                    norm_label = RAW_LABEL_MAPPING.get(raw_label.strip().lower())
                    clean_text = text.strip()
                    if norm_label and clean_text:
                        samples.append(
                            DatasetSample(
                                raw_text=clean_text,
                                clean_text=clean_text,
                                label=norm_label,
                                source="sms_spam_collection",
                                subcategory=None,
                            )
                        )
        return samples

    def load_dataset_10191(self) -> list[DatasetSample]:
        """Load Dataset_10191.csv (CSV with TEXT, LABEL columns)."""
        filepath = self.raw_dir / "Dataset_10191.csv"
        samples: list[DatasetSample] = []
        if not filepath.is_file():
            logger.warning("Dataset_10191.csv not found at %s", filepath)
            return samples

        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                text = (row.get("TEXT") or row.get("text") or "").strip()
                label = (row.get("LABEL") or row.get("label") or "").strip().lower()
                norm_label = RAW_LABEL_MAPPING.get(label)
                if text and norm_label:
                    samples.append(
                        DatasetSample(
                            raw_text=text,
                            clean_text=text,
                            label=norm_label,
                            source="dataset_10191",
                            subcategory=None,
                        )
                    )
        return samples

    def load_indian_reviewed_scams(self) -> list[DatasetSample]:
        """Load curated and reviewed Indian payment fraud and scam samples."""
        filepath = self.raw_dir / "indian_payment_scams_reviewed.csv"
        samples: list[DatasetSample] = []
        if not filepath.is_file():
            logger.warning("indian_payment_scams_reviewed.csv not found at %s", filepath)
            return samples

        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            reader = csv.DictReader(f)
            for row in reader:
                text = (row.get("text") or "").strip()
                label = (row.get("label") or "").strip().lower()
                norm_label = RAW_LABEL_MAPPING.get(label)
                subcat = (row.get("subcategory") or "").strip() or None
                source = (row.get("source") or "indian_reviewed").strip()
                if text and norm_label:
                    samples.append(
                        DatasetSample(
                            raw_text=text,
                            clean_text=text,
                            label=norm_label,
                            source=f"indian_reviewed_{source}",
                            subcategory=subcat,
                        )
                    )
        return samples

    def process_and_deduplicate(
        self, samples: list[DatasetSample]
    ) -> tuple[list[DatasetSample], dict[str, Any]]:
        """Deduplicate samples by normalized text and resolve label conflicts.

        Returns deduplicated sample list and stats dict.
        """
        initial_count = len(samples)
        grouped_by_norm: dict[str, list[DatasetSample]] = {}

        for s in samples:
            key = normalize_text_for_dedup(s.raw_text)
            if not key or len(key) < 3:
                continue
            grouped_by_norm.setdefault(key, []).append(s)

        deduped: list[DatasetSample] = []
        conflicts_resolved = 0
        duplicate_dropped = 0

        for key, group in grouped_by_norm.items():
            if len(group) == 1:
                deduped.append(group[0])
                continue

            duplicate_dropped += len(group) - 1
            labels = {item.label for item in group}
            if len(labels) == 1:
                # Same label duplicates, pick the one with most detailed subcategory or longest raw text
                best = max(group, key=lambda x: (1 if x.subcategory else 0, len(x.raw_text)))
                deduped.append(best)
            else:
                # Conflicting labels: resolve using conservative priority
                conflicts_resolved += 1
                best_label = max(labels, key=lambda l: LABEL_PRIORITY.get(l, 0))
                candidates = [item for item in group if item.label == best_label]
                best = max(candidates, key=lambda x: (1 if x.subcategory else 0, len(x.raw_text)))
                deduped.append(best)

        stats = {
            "initial_samples": initial_count,
            "deduplicated_samples": len(deduped),
            "duplicates_dropped": duplicate_dropped,
            "conflicts_resolved": conflicts_resolved,
        }
        return deduped, stats

    def split_dataset(
        self, samples: list[DatasetSample], train_ratio: float = 0.70, val_ratio: float = 0.15
    ) -> tuple[list[DatasetSample], list[DatasetSample], list[DatasetSample]]:
        """Perform leak-free stratified split into train, val, and test partitions."""
        labels = [s.label for s in samples]

        # First split off test set: 1.0 - (train_ratio + val_ratio)
        test_ratio = 1.0 - (train_ratio + val_ratio)
        train_val_samples, test_samples = train_test_split(
            samples,
            test_size=test_ratio,
            random_state=self.random_state,
            stratify=labels,
        )

        # Second split between train and val
        val_relative_ratio = val_ratio / (train_ratio + val_ratio)
        train_val_labels = [s.label for s in train_val_samples]
        train_samples, val_samples = train_test_split(
            train_val_samples,
            test_size=val_relative_ratio,
            random_state=self.random_state,
            stratify=train_val_labels,
        )

        # Verification: check that no normalized text leaks across splits
        train_keys = {normalize_text_for_dedup(s.raw_text) for s in train_samples}
        val_keys = {normalize_text_for_dedup(s.raw_text) for s in val_samples}
        test_keys = {normalize_text_for_dedup(s.raw_text) for s in test_samples}

        leak_train_val = train_keys.intersection(val_keys)
        leak_train_test = train_keys.intersection(test_keys)
        leak_val_test = val_keys.intersection(test_keys)

        if leak_train_val or leak_train_test or leak_val_test:
            raise RuntimeError(
                f"Data leakage detected! Overlaps: Train-Val={len(leak_train_val)}, "
                f"Train-Test={len(leak_train_test)}, Val-Test={len(leak_val_test)}"
            )

        return train_samples, val_samples, test_samples

    def build_summary(
        self,
        all_samples: list[DatasetSample],
        train: list[DatasetSample],
        val: list[DatasetSample],
        test: list[DatasetSample],
        dedup_stats: dict[str, Any],
    ) -> dict[str, Any]:
        """Compute label distributions, class ratios, and split summaries."""

        def count_labels(subset: list[DatasetSample]) -> dict[str, int]:
            counts = {label: 0 for label in CANONICAL_LABELS}
            for s in subset:
                counts[s.label] = counts.get(s.label, 0) + 1
            return counts

        total_counts = count_labels(all_samples)
        train_counts = count_labels(train)
        val_counts = count_labels(val)
        test_counts = count_labels(test)

        total_n = len(all_samples)
        class_imbalance = {
            label: round((count / total_n) * 100, 2) if total_n > 0 else 0
            for label, count in total_counts.items()
        }

        return {
            "random_seed": self.random_state,
            "deduplication_stats": dedup_stats,
            "canonical_labels": list(CANONICAL_LABELS),
            "total_samples": total_n,
            "class_imbalance_pct": class_imbalance,
            "splits": {
                "train": {"total": len(train), "by_class": train_counts},
                "val": {"total": len(val), "by_class": val_counts},
                "test": {"total": len(test), "by_class": test_counts},
            },
        }

    def save_partition(self, samples: list[DatasetSample], filename: str) -> Path:
        """Write partition samples to CSV."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        target = self.output_dir / filename
        with open(target, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(
                f, fieldnames=["text", "label", "source", "subcategory"]
            )
            writer.writeheader()
            for s in samples:
                writer.writerow(
                    {
                        "text": s.clean_text,
                        "label": s.label,
                        "source": s.source,
                        "subcategory": s.subcategory or "",
                    }
                )
        return target

    def run(self) -> dict[str, Any]:
        """Execute end-to-end dataset pipeline and return summary."""
        logger.info("Loading raw datasets from %s", self.raw_dir)
        raw_samples: list[DatasetSample] = []
        raw_samples.extend(self.load_dataset_10191())
        raw_samples.extend(self.load_sms_spam_collection())
        raw_samples.extend(self.load_indian_reviewed_scams())

        logger.info("Loaded %d raw samples. Deduplicating...", len(raw_samples))
        deduped, stats = self.process_and_deduplicate(raw_samples)
        logger.info(
            "Deduplication complete: %d unique samples retained (%d dropped, %d conflicts resolved).",
            len(deduped),
            stats["duplicates_dropped"],
            stats["conflicts_resolved"],
        )

        train, val, test = self.split_dataset(deduped)
        logger.info(
            "Splits generated: Train=%d, Val=%d, Test=%d (Zero leak verified)",
            len(train),
            len(val),
            len(test),
        )

        # Save processed CSVs
        self.save_partition(train, "train.csv")
        self.save_partition(val, "val.csv")
        self.save_partition(test, "test.csv")

        summary = self.build_summary(deduped, train, val, test, stats)
        summary_path = self.output_dir / "dataset_summary.json"
        with open(summary_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2)

        logger.info("Dataset summary saved to %s", summary_path)
        return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    pipeline = DatasetPipeline()
    summary = pipeline.run()
    print(json.dumps(summary, indent=2))
