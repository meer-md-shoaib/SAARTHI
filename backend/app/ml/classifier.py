"""Singleton model loader and inference engine for message classification."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib

logger = logging.getLogger("saarthi.ml.classifier")

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"
DEFAULT_MODEL_FILE = ARTIFACTS_DIR / "model_v1.joblib"
DEFAULT_LABEL_MAP = ARTIFACTS_DIR / "label_map.json"
DEFAULT_METADATA = ARTIFACTS_DIR / "metadata.json"


@dataclass
class RawPrediction:
    predicted_category: str
    confidence: float
    class_probabilities: dict[str, float]
    model_version: str


class MessageClassifier:
    """Singleton inference wrapper for the trained TF-IDF classification pipeline."""

    _instance: MessageClassifier | None = None

    def __init__(
        self,
        model_path: Path | None = None,
        label_map_path: Path | None = None,
        metadata_path: Path | None = None,
    ) -> None:
        self.model_path = model_path or DEFAULT_MODEL_FILE
        self.label_map_path = label_map_path or DEFAULT_LABEL_MAP
        self.metadata_path = metadata_path or DEFAULT_METADATA

        self.pipeline: Any = None
        self.label_map: dict[str, Any] = {}
        self.metadata: dict[str, Any] = {}
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Load fitted pipeline and metadata from disk."""
        if not self.model_path.is_file():
            logger.warning(
                "Model artifact not found at %s. Please run python -m ml.train",
                self.model_path,
            )
            return

        try:
            self.pipeline = joblib.load(self.model_path)
            logger.info("Loaded message classifier pipeline from %s", self.model_path)
        except Exception as e:
            logger.error("Failed to load model pipeline: %s", e)
            self.pipeline = None

        if self.label_map_path.is_file():
            try:
                with open(self.label_map_path, "r", encoding="utf-8") as f:
                    self.label_map = json.load(f)
            except Exception as e:
                logger.error("Failed to load label map: %s", e)

        if self.metadata_path.is_file():
            try:
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
            except Exception as e:
                logger.error("Failed to load model metadata: %s", e)

    @property
    def is_ready(self) -> bool:
        return self.pipeline is not None

    @property
    def model_version(self) -> str:
        return self.metadata.get("model_version", "1.0.0")

    def predict(self, text: str) -> RawPrediction:
        """Run text inference and return calibrated probabilities."""
        if not self.is_ready:
            raise RuntimeError(
                "Model is not loaded. Train the model using `python -m ml.train`"
            )

        # CalibratedClassifierCV or LogisticRegression supports predict_proba
        probabilities = self.pipeline.predict_proba([text])[0]
        classes = list(self.pipeline.classes_)

        prob_dict: dict[str, float] = {
            cls_name: round(float(prob), 4) for cls_name, prob in zip(classes, probabilities)
        }

        # Select highest probability class
        best_idx = int(probabilities.argmax())
        best_class = str(classes[best_idx])
        best_conf = round(float(probabilities[best_idx]), 4)

        return RawPrediction(
            predicted_category=best_class,
            confidence=best_conf,
            class_probabilities=prob_dict,
            model_version=self.model_version,
        )


def get_message_classifier() -> MessageClassifier:
    """Access or initialize the singleton MessageClassifier instance."""
    if MessageClassifier._instance is None:
        MessageClassifier._instance = MessageClassifier()
    return MessageClassifier._instance
