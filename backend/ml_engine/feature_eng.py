import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler


def engineer_features(df: pd.DataFrame, target_col: str) -> tuple[pd.DataFrame, dict]:
    """Encode, scale, extract datetime features. Returns processed df + metadata."""
    df = df.copy()
    meta = {"encoders": {}, "scaler_cols": [], "dropped_cols": []}

    # Drop target temporarily
    target = df.pop(target_col) if target_col in df.columns else None

    # Datetime feature extraction
    for col in df.columns:
        if pd.api.types.is_datetime64_any_dtype(df[col]) or (
            df[col].dtype == object and pd.to_datetime(df[col], errors='coerce').notna().mean() > 0.8
        ):
            df[col] = pd.to_datetime(df[col], errors='coerce')
            df[f"{col}_year"] = df[col].dt.year
            df[f"{col}_month"] = df[col].dt.month
            df[f"{col}_day"] = df[col].dt.day
            df[f"{col}_weekday"] = df[col].dt.weekday
            df = df.drop(columns=[col])

    # Encode categoricals
    for col in df.select_dtypes(include=['object']).columns:
        n_unique = df[col].nunique()
        if n_unique <= 10:
            df = pd.get_dummies(df, columns=[col], prefix=col, dtype=int)
            meta["encoders"][col] = "onehot"
        else:
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col].astype(str))
            meta["encoders"][col] = "label"

    # Remove highly correlated features
    corr = df.select_dtypes(include=[np.number]).corr().abs()
    upper = corr.where(np.triu(np.ones(corr.shape), k=1).astype(bool))
    to_drop = [c for c in upper.columns if any(upper[c] > 0.95)]
    if to_drop:
        df = df.drop(columns=to_drop)
        meta["dropped_cols"] = to_drop

    # Scale numerics
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if num_cols:
        scaler = StandardScaler()
        df[num_cols] = scaler.fit_transform(df[num_cols])
        meta["scaler_cols"] = num_cols

    if target is not None:
        df[target_col] = target.values

    return df, meta
