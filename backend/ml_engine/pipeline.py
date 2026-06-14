import pandas as pd
import numpy as np
import asyncio
import joblib
import json
import os
from .eda import run_eda
from .cleaner import clean_data
from .feature_eng import engineer_features
from .model_selector import select_and_train, detect_problem_type
from .validator import validate_model
from .report_generator import generate_report
from ..app.services.llm_service import ask_llm


def log_to_db(db, project_id: str, stage: str, message: str, decision: str):
    from ..app.models.dataset import PipelineLog
    log = PipelineLog(project_id=project_id, stage=stage, message=message, decision=decision)
    db.add(log)
    db.commit()


def run_full_pipeline(project_id: str, dataset_path: str, filename: str, prediction_task: str, db) -> dict:
    # Load
    df = pd.read_csv(dataset_path) if filename.endswith('.csv') else pd.read_excel(dataset_path)

    # EDA
    eda_summary = run_eda(df)
    log_to_db(db, project_id, "eda",
        f"I analyzed your dataset with {eda_summary['shape']['rows']} rows and {eda_summary['shape']['cols']} columns. Found {eda_summary['missing_total']} missing values and {eda_summary['duplicate_rows']} duplicates.",
        "Completed EDA — proceeding to data cleaning.")

    # Cleaning
    df_clean, actions = clean_data(df)
    for action in actions:
        log_to_db(db, project_id, "clean", f"Cleaning step: {action['action']}", action['detail'])
    log_to_db(db, project_id, "clean",
        f"Data cleaning complete. Applied {len(actions)} cleaning operations. Dataset now has {len(df_clean)} rows.",
        "Cleaned dataset ready for feature engineering.")

    # Detect target column (last column heuristic, or from task name)
    target_col = df_clean.columns[-1]
    for col in df_clean.columns:
        col_lower = col.lower()
        if any(word in col_lower for word in ['churn', 'target', 'label', 'outcome', 'result', 'price', 'salary', 'revenue']):
            target_col = col
            break

    # Feature Engineering
    df_feat, feat_meta = engineer_features(df_clean, target_col)
    log_to_db(db, project_id, "feature_eng",
        f"Encoded {len(feat_meta['encoders'])} categorical columns and scaled {len(feat_meta['scaler_cols'])} numeric columns.",
        f"Dropped {len(feat_meta['dropped_cols'])} highly correlated columns: {feat_meta['dropped_cols']}")

    # Prepare X, y
    X = df_feat.drop(columns=[target_col])
    y = df_feat[target_col]
    problem_type = detect_problem_type(y)
    log_to_db(db, project_id, "model_select",
        f"Detected problem type: {problem_type}. Task: '{prediction_task}'. Target column: '{target_col}'.",
        f"Will train 4 {problem_type} models and select the best by cross-validation.")

    # Train
    best_model, best_name, all_scores = select_and_train(X, y, problem_type)
    scores_str = ", ".join([f"{k}: {v:.3f}" for k, v in all_scores.items()])
    log_to_db(db, project_id, "train",
        f"Trained 4 models. Scores — {scores_str}.",
        f"Selected '{best_name}' as the best model.")

    # Validate
    val_result = validate_model(best_model, X, y, problem_type)
    metrics_str = ", ".join([f"{k}: {v}" for k, v in val_result['metrics'].items()])
    log_to_db(db, project_id, "validate",
        f"5-fold cross-validation complete. Final metrics: {metrics_str}.",
        "Model validated. Generating report.")

    # Confidence score
    primary_metric = list(val_result['metrics'].values())[0]
    confidence_score = round(float(primary_metric) * 100, 1)

    # --- Save model and preprocessing metadata for prediction ---
    os.makedirs("./reports", exist_ok=True)
    
    # Save the trained model
    model_path = f"./reports/{project_id}_model.joblib"
    joblib.dump(best_model, model_path)

    # Collect feature metadata for the prediction form
    # Build column info from original cleaned data (before feature engineering)
    feature_columns_meta = []
    for col in df_clean.columns:
        if col == target_col:
            continue
        col_meta = {"name": col, "dtype": str(df_clean[col].dtype)}
        if df_clean[col].dtype == 'object':
            col_meta["type"] = "categorical"
            col_meta["unique_values"] = df_clean[col].dropna().unique().tolist()[:50]
        elif pd.api.types.is_numeric_dtype(df_clean[col]):
            col_meta["type"] = "numeric"
            col_meta["min"] = float(df_clean[col].min()) if not pd.isna(df_clean[col].min()) else 0
            col_meta["max"] = float(df_clean[col].max()) if not pd.isna(df_clean[col].max()) else 100
            col_meta["mean"] = float(df_clean[col].mean()) if not pd.isna(df_clean[col].mean()) else 0
            col_meta["median"] = float(df_clean[col].median()) if not pd.isna(df_clean[col].median()) else 0
        else:
            col_meta["type"] = "text"
        feature_columns_meta.append(col_meta)

    # Save preprocessing metadata
    preprocessing_meta = {
        "target_col": target_col,
        "problem_type": problem_type,
        "best_model_name": best_name,
        "feature_columns": feature_columns_meta,
        "feat_eng_meta": {
            "encoders": feat_meta["encoders"],
            "scaler_cols": feat_meta["scaler_cols"],
            "dropped_cols": feat_meta["dropped_cols"],
        },
        "training_columns": X.columns.tolist(),
        "dataset_path": dataset_path,
        "original_filename": filename,
    }
    meta_path = f"./reports/{project_id}_meta.json"
    with open(meta_path, "w") as f:
        json.dump(preprocessing_meta, f, indent=2, default=str)

    # Report Narrative (LLM)
    narrative = ""
    try:
        prompt = f"""You are a senior Data Scientist writing a concise executive summary for a client report. 
        Task: {prediction_task}. Best Model: {best_name}. 
        Confidence Score: {confidence_score}%. 
        Features: {val_result['feature_importance']}. 
        Cleaning: {len(actions)} actions.
        Write exactly 2 concise, professional paragraphs explaining the dataset, key features determining the outcome, and why the model is reliable."""
        # Note: We need the event loop for async LLM call here, since pipeline runs in a sync background task.
        narrative = asyncio.run(ask_llm(prompt))
    except Exception as e:
        print(f"Narrative generation failed: {e}")
        narrative = "The AI successfully processed the dataset, cleaned anomalies, and engineered features. It evaluated multiple models and selected the best performing architecture based on cross-validation scores."

    # Report
    report_data = {
        "project_id": project_id,
        "task": prediction_task,
        "dataset": {"rows": len(df), "cols": len(df.columns)},
        "best_model": best_name,
        "problem_type": problem_type,
        "target_column": target_col,
        "metrics": val_result["metrics"],
        "train_metrics": val_result.get("train_metrics", {}),
        "baseline_metrics": val_result.get("baseline_metrics", {}),
        "residual_data": val_result.get("residual_data", {}),
        "feature_importance": val_result["feature_importance"],
        "confidence_score": confidence_score,
        "all_model_scores": all_scores,
        "cleaning_actions": actions,
        "pca_data": val_result.get("pca_data", []),
        "pair_plot_data": val_result.get("pair_plot_data", {}),
        "narrative": narrative,
        "feature_columns": feature_columns_meta,
    }
    generate_report(project_id, report_data)
    log_to_db(db, project_id, "report",
        f"Report generated successfully. Confidence score: {confidence_score}%.",
        "Pipeline complete. Report and PDF are ready for download.")

    return report_data
