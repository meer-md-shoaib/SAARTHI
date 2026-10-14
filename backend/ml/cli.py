"""Command-line interface for the SAARTHI SafePay machine learning pipeline.

Commands:
    python -m ml.cli prepare
        Load, deduplicate, and split raw datasets into clean train/val/test partitions.

    python -m ml.cli train
        Train candidate classifiers, select best model on validation set, and export versioned artifacts.

    python -m ml.cli evaluate [--split {test,val,train}]
        Compute detailed classification report and confusion matrix for an existing artifact.

    python -m ml.cli predict --text "Your Electricity bill is pending..."
        Run inference pipeline on a custom message and display risk assessment, evidence, and next steps.
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

from .dataset import DatasetPipeline
from .evaluate import compute_metrics, format_markdown_report
from .train import train_and_select_model


def setup_logger(verbose: bool = False) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )


def cmd_prepare(args: argparse.Namespace) -> int:
    dp = DatasetPipeline(
        raw_dir=args.raw_dir,
        output_dir=args.output_dir,
        random_state=args.seed,
    )
    summary = dp.run()
    print("\nDataset Preparation Completed:")
    print(json.dumps(summary, indent=2))
    return 0


def cmd_train(args: argparse.Namespace) -> int:
    report = train_and_select_model(
        processed_dir=Path(args.processed_dir) if args.processed_dir else None,
        artifacts_dir=Path(args.artifacts_dir) if args.artifacts_dir else None,
        random_state=args.seed,
    )
    print("\nTraining & Model Selection Completed:")
    print(f"Selected Model: {report['metadata']['selected_architecture']}")
    print(f"Artifact File: {report['metadata']['artifact_file']}")
    print("\nHeld-out Test Set Performance:")
    print(json.dumps(report["held_out_test_metrics"]["per_class"], indent=2))
    return 0


def cmd_evaluate(args: argparse.Namespace) -> int:
    from .train import load_partition
    from app.ml.classifier import get_message_classifier

    base = Path(__file__).resolve().parent.parent
    p_dir = Path(args.processed_dir) if args.processed_dir else base / "data" / "processed"
    split_file = p_dir / f"{args.split}.csv"

    if not split_file.is_file():
        print(f"Error: Split file '{split_file}' does not exist. Run prepare/train first.")
        return 1

    texts, labels = load_partition(split_file)
    classifier = get_message_classifier()

    if not classifier.is_ready:
        print("Error: Model artifact not loaded. Run train first.")
        return 1

    y_pred = [classifier.predict(t).predicted_category for t in texts]
    unique_labels = sorted(list(set(labels)))
    results = compute_metrics(labels, y_pred, labels=unique_labels, split_name=args.split)
    print(format_markdown_report(results, candidate_name=f"Model v{classifier.model_version}"))
    return 0


def cmd_predict(args: argparse.Namespace) -> int:
    from app.ml.service import get_message_analysis_service

    service = get_message_analysis_service()
    result = service.analyze_message(text=args.text, language=args.language)
    print("\n--- SAARTHI Message Analysis Result ---")
    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        prog="python -m ml.cli",
        description="SAARTHI SafePay ML Pipeline CLI",
    )
    parser.add_argument("-v", "--verbose", action="store_true", help="Enable verbose logging")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # prepare
    p_prep = subparsers.add_parser("prepare", help="Prepare clean and leak-free dataset splits")
    p_prep.add_argument("--raw-dir", type=str, default=None, help="Directory containing raw data")
    p_prep.add_argument("--output-dir", type=str, default=None, help="Output directory for processed splits")
    p_prep.add_argument("--seed", type=int, default=42, help="Random seed for splitting")
    p_prep.set_defaults(func=cmd_prepare)

    # train
    p_train = subparsers.add_parser("train", help="Train baseline candidates and select best model")
    p_train.add_argument("--processed-dir", type=str, default=None, help="Directory with processed CSVs")
    p_train.add_argument("--artifacts-dir", type=str, default=None, help="Directory to save model artifacts")
    p_train.add_argument("--seed", type=int, default=42, help="Random seed")
    p_train.set_defaults(func=cmd_train)

    # evaluate
    p_eval = subparsers.add_parser("evaluate", help="Evaluate model artifact on a dataset split")
    p_eval.add_argument("--split", choices=["test", "val", "train"], default="test", help="Partition to evaluate")
    p_eval.add_argument("--processed-dir", type=str, default=None, help="Directory with processed CSVs")
    p_eval.set_defaults(func=cmd_evaluate)

    # predict
    p_pred = subparsers.add_parser("predict", help="Analyze a single message for fraud")
    p_pred.add_argument("--text", type=str, required=True, help="Message text to analyze")
    p_pred.add_argument("--language", choices=["en", "hi", "kn"], default="en", help="Language for next steps")
    p_pred.set_defaults(func=cmd_predict)

    args = parser.parse_args()
    setup_logger(args.verbose)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
