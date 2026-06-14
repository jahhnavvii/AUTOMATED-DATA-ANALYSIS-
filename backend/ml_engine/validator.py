import pandas as pd
import numpy as np
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    roc_auc_score, r2_score, mean_squared_error, mean_absolute_error
)
from sklearn.decomposition import PCA
from sklearn.dummy import DummyClassifier, DummyRegressor


def _compute_classification_metrics(y_true, y_pred, y_prob=None):
    """Compute classification metrics from predictions."""
    metrics = {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, average='weighted', zero_division=0)), 4),
        "precision": round(float(precision_score(y_true, y_pred, average='weighted', zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, average='weighted', zero_division=0)), 4),
    }
    if y_prob is not None:
        try:
            if y_prob.shape[1] == 2:
                metrics["roc_auc"] = round(float(roc_auc_score(y_true, y_prob[:, 1])), 4)
        except Exception:
            pass
    return metrics


def _compute_regression_metrics(y_true, y_pred):
    """Compute regression metrics from predictions."""
    return {
        "r2_score": round(float(r2_score(y_true, y_pred)), 4),
        "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 4),
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
    }


def validate_model(model, X: pd.DataFrame, y: pd.Series, problem_type: str) -> dict:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model.fit(X_train, y_train)

    # --- Trained model predictions ---
    y_pred_test = model.predict(X_test)
    y_pred_train = model.predict(X_train)

    # --- Baseline (before training) metrics using DummyEstimator ---
    baseline_metrics = {}
    try:
        if problem_type == "classification":
            dummy = DummyClassifier(strategy="most_frequent", random_state=42)
            dummy.fit(X_train, y_train)
            y_dummy_pred = dummy.predict(X_test)
            baseline_metrics = _compute_classification_metrics(y_test, y_dummy_pred)
        else:
            dummy = DummyRegressor(strategy="mean")
            dummy.fit(X_train, y_train)
            y_dummy_pred = dummy.predict(X_test)
            baseline_metrics = _compute_regression_metrics(y_test, y_dummy_pred)
    except Exception:
        pass

    # --- Trained model metrics (test set) ---
    if problem_type == "classification":
        y_prob = None
        try:
            y_prob = model.predict_proba(X_test)
        except Exception:
            pass
        metrics = _compute_classification_metrics(y_test, y_pred_test, y_prob)
    else:
        metrics = _compute_regression_metrics(y_test, y_pred_test)

    # --- Train set metrics (for overfitting analysis) ---
    if problem_type == "classification":
        y_prob_train = None
        try:
            y_prob_train = model.predict_proba(X_train)
        except Exception:
            pass
        train_metrics = _compute_classification_metrics(y_train, y_pred_train, y_prob_train)
    else:
        train_metrics = _compute_regression_metrics(y_train, y_pred_train)

    # --- Residual analysis (regression only) ---
    residual_data = {}
    if problem_type == "regression":
        try:
            residuals = (y_test.values - y_pred_test).tolist()
            # Histogram bins for residual distribution
            hist_counts, bin_edges = np.histogram(residuals, bins=20)
            residual_data = {
                "residuals": residuals[:200],  # cap for frontend performance
                "predicted": y_pred_test[:200].tolist(),
                "actual": y_test.values[:200].tolist(),
                "hist_counts": hist_counts.tolist(),
                "hist_bins": bin_edges.tolist(),
            }
        except Exception:
            pass

    # Feature importance
    importances = {}
    if hasattr(model, "feature_importances_"):
        fi = model.feature_importances_
        importances = dict(sorted(
            zip(X.columns.tolist(), fi.tolist()),
            key=lambda x: x[1], reverse=True
        )[:15])
    elif hasattr(model, "coef_"):
        coef = np.abs(model.coef_).flatten() if model.coef_.ndim > 1 else np.abs(model.coef_)
        importances = dict(sorted(
            zip(X.columns.tolist(), coef.tolist()),
            key=lambda x: x[1], reverse=True
        )[:15])

    # 3D PCA
    pca_data = []
    try:
        pca = PCA(n_components=3)
        X_pca = pca.fit_transform(X)
        
        # sample 300 rows for frontend performance
        sample_size = min(300, len(X_pca))
        idx = np.random.choice(len(X_pca), sample_size, replace=False)
        
        for i in idx:
            pca_data.append({
                "x": float(X_pca[i, 0]),
                "y": float(X_pca[i, 1]),
                "z": float(X_pca[i, 2]),
                "target": str(y.iloc[i]) if hasattr(y, 'iloc') else str(y[i])
            })
    except Exception:
        pass

    # Pair plot data (top 4 features + target)
    pair_features = list(importances.keys())[:4]
    pair_plot_data = []
    if pair_features:
        try:
            df_pair = X[pair_features].copy()
            df_pair['target'] = y.values if hasattr(y, 'values') else y
            # Sample 300
            if len(df_pair) > 300:
                df_pair = df_pair.sample(300, random_state=42)
            
            # Convert to dict format
            # Format: { "feature_name": [values], ... }
            pair_plot_data = {
                feat: df_pair[feat].tolist() for feat in pair_features
            }
            pair_plot_data['target'] = df_pair['target'].astype(str).tolist()
        except Exception:
            pass

    return {
        "metrics": metrics,
        "train_metrics": train_metrics,
        "baseline_metrics": baseline_metrics,
        "residual_data": residual_data,
        "feature_importance": importances, 
        "problem_type": problem_type,
        "pca_data": pca_data,
        "pair_plot_data": pair_plot_data
    }
