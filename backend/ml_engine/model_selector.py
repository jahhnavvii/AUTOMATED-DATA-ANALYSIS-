import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import cross_val_score
from xgboost import XGBClassifier, XGBRegressor
from lightgbm import LGBMClassifier, LGBMRegressor


def detect_problem_type(y: pd.Series) -> str:
    if y.dtype == object or y.nunique() <= 20:
        return "classification"
    return "regression"


def select_and_train(X: pd.DataFrame, y: pd.Series, problem_type: str) -> tuple:
    """Train multiple models, pick the best by CV score."""
    if problem_type == "classification":
        candidates = {
            "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1),
            "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
            "XGBoost": XGBClassifier(n_estimators=100, random_state=42, verbosity=0, n_jobs=-1),
            "LightGBM": LGBMClassifier(n_estimators=100, random_state=42, verbose=-1, n_jobs=-1),
        }
        scoring = "f1_weighted"
    else:
        candidates = {
            "Random Forest": RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
            "Ridge Regression": Ridge(),
            "XGBoost": XGBRegressor(n_estimators=100, random_state=42, verbosity=0, n_jobs=-1),
            "LightGBM": LGBMRegressor(n_estimators=100, random_state=42, verbose=-1, n_jobs=-1),
        }
        scoring = "r2"

    scores = {}
    for name, model in candidates.items():
        try:
            cv_scores = cross_val_score(model, X, y, cv=3, scoring=scoring, n_jobs=-1)
            scores[name] = float(cv_scores.mean())
        except Exception:
            scores[name] = -999.0

    best_name = max(scores, key=scores.get)
    best_model = candidates[best_name]
    best_model.fit(X, y)
    return best_model, best_name, scores
