import os
import json
import joblib
import pandas as pd
import numpy as np
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any
from ..database import get_db
from ..models.project import Project
from ..routers.auth import get_current_user
from ...ml_engine.feature_eng import engineer_features

router = APIRouter()


class PredictionRequest(BaseModel):
    features: dict[str, Any]


class BatchPredictionRequest(BaseModel):
    rows: list[dict[str, Any]]


def _load_model_and_meta(project_id: str):
    """Load saved model and preprocessing metadata."""
    model_path = f"./reports/{project_id}_model.joblib"
    meta_path = f"./reports/{project_id}_meta.json"

    if not os.path.exists(model_path):
        raise HTTPException(404, "Trained model not found. Run the pipeline first.")
    if not os.path.exists(meta_path):
        raise HTTPException(404, "Preprocessing metadata not found. Run the pipeline first.")

    model = joblib.load(model_path)
    with open(meta_path) as f:
        meta = json.load(f)
    return model, meta


def _preprocess_input(input_df: pd.DataFrame, meta: dict) -> pd.DataFrame:
    """Apply the same preprocessing pipeline as training."""
    df = input_df.copy()
    target_col = meta["target_col"]
    training_columns = meta["training_columns"]

    # Apply feature engineering (same as training)
    # We add a dummy target column temporarily
    if target_col not in df.columns:
        df[target_col] = 0

    df_feat, _ = engineer_features(df, target_col)
    df_feat = df_feat.drop(columns=[target_col], errors='ignore')

    # Align columns with training data
    for col in training_columns:
        if col not in df_feat.columns:
            df_feat[col] = 0
    df_feat = df_feat[training_columns]

    return df_feat


@router.get("/{project_id}/columns")
def get_prediction_columns(
    project_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Return feature columns with types and sample values for the prediction form."""
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    _, meta = _load_model_and_meta(project_id)

    return {
        "target_column": meta["target_col"],
        "problem_type": meta["problem_type"],
        "best_model": meta["best_model_name"],
        "feature_columns": meta["feature_columns"],
    }


@router.post("/{project_id}")
def predict(
    project_id: str,
    req: PredictionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Make a single prediction with user-provided feature values."""
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    model, meta = _load_model_and_meta(project_id)

    try:
        input_df = pd.DataFrame([req.features])
        X_processed = _preprocess_input(input_df, meta)
        prediction = model.predict(X_processed)
        result = prediction[0]

        # Get confidence/probability for classification
        confidence = None
        probabilities = None
        if meta["problem_type"] == "classification":
            try:
                probs = model.predict_proba(X_processed)[0]
                confidence = round(float(max(probs)) * 100, 2)
                classes = model.classes_.tolist() if hasattr(model, 'classes_') else list(range(len(probs)))
                probabilities = {str(c): round(float(p) * 100, 2) for c, p in zip(classes, probs)}
            except Exception:
                pass

        return {
            "prediction": str(result) if isinstance(result, (np.integer, np.floating, np.bool_)) else result,
            "confidence": confidence,
            "probabilities": probabilities,
            "problem_type": meta["problem_type"],
            "model_used": meta["best_model_name"],
        }
    except Exception as e:
        raise HTTPException(400, f"Prediction failed: {str(e)}")


@router.post("/{project_id}/batch")
def predict_batch(
    project_id: str,
    req: BatchPredictionRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Make batch predictions on multiple rows."""
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(404, "Project not found")

    model, meta = _load_model_and_meta(project_id)

    try:
        input_df = pd.DataFrame(req.rows)
        X_processed = _preprocess_input(input_df, meta)
        predictions = model.predict(X_processed)

        results = []
        for i, pred in enumerate(predictions):
            entry = {
                "row_index": i,
                "prediction": str(pred) if isinstance(pred, (np.integer, np.floating, np.bool_)) else pred,
            }
            if meta["problem_type"] == "classification":
                try:
                    probs = model.predict_proba(X_processed)[i]
                    entry["confidence"] = round(float(max(probs)) * 100, 2)
                except Exception:
                    pass
            results.append(entry)

        return {
            "predictions": results,
            "count": len(results),
            "problem_type": meta["problem_type"],
            "model_used": meta["best_model_name"],
        }
    except Exception as e:
        raise HTTPException(400, f"Batch prediction failed: {str(e)}")
