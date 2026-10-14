# SAARTHI SafePay - Machine Learning Model Evaluation Report

- **Model Version**: 1.0.0
- **Selected Pipeline**: `LinearSVC_Calibrated_ClassWeighted`
- **Evaluation Timestamp**: 2026-10-14T18:14:47.508481+00:00

## Candidate Validation Comparison

| Candidate | Accuracy | Macro F1 | Scam F1 | Scam Recall |
| :--- | :---: | :---: | :---: | :---: |
| `LogisticRegression_ClassWeighted` | 97.23% | 0.9615 | 0.9545 | 0.9665 |
| `LinearSVC_Calibrated_ClassWeighted` | 97.67% | 0.9669 | 0.9599 | 0.9693 |

## Held-out Test Set Results (Untouched Partition)

### Evaluation Report: LinearSVC_Calibrated_ClassWeighted (Held_Out_Test)

- **Total Samples**: 1374
- **Overall Accuracy**: 96.80%
- **Macro F1**: 0.9548 | **Macro Precision**: 0.9561 | **Macro Recall**: 0.9535
- **Weighted F1**: 0.9679 | **Weighted Precision**: 0.9678 | **Weighted Recall**: 0.9680

#### Per-Class Performance

| Class | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- |
| `legitimate` | 0.9946 | 0.9986 | 0.9966 | 734 |
| `promotional` | 0.9348 | 0.9149 | 0.9247 | 282 |
| `scam` | 0.9391 | 0.9469 | 0.9430 | 358 |

#### Confusion Matrix (True Row \ Predicted Col)

| True \ Pred | `legitimate` | `promotional` | `scam` |
| :--- | :---: | :---: | :---: |
| `legitimate` | 733 | 0 | 1 |
| `promotional` | 3 | 258 | 21 |
| `scam` | 1 | 18 | 339 |

## Training Set Results (Generalization Baseline)

### Evaluation Report: LinearSVC_Calibrated_ClassWeighted (Train_Reference)

- **Total Samples**: 6408
- **Overall Accuracy**: 99.45%
- **Macro F1**: 0.9921 | **Macro Precision**: 0.9921 | **Macro Recall**: 0.9920
- **Weighted F1**: 0.9945 | **Weighted Precision**: 0.9945 | **Weighted Recall**: 0.9945

#### Per-Class Performance

| Class | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- |
| `legitimate` | 1.0000 | 1.0000 | 1.0000 | 3425 |
| `promotional` | 0.9871 | 0.9863 | 0.9867 | 1315 |
| `scam` | 0.9892 | 0.9898 | 0.9895 | 1668 |

#### Confusion Matrix (True Row \ Predicted Col)

| True \ Pred | `legitimate` | `promotional` | `scam` |
| :--- | :---: | :---: | :---: |
| `legitimate` | 3425 | 0 | 0 |
| `promotional` | 0 | 1297 | 18 |
| `scam` | 0 | 17 | 1651 |
