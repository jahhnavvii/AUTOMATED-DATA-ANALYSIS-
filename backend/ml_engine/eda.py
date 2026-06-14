import pandas as pd
import numpy as np


def run_eda(df: pd.DataFrame) -> dict:
    """Run EDA and return a summary dict."""
    summary = {
        "shape": {"rows": int(df.shape[0]), "cols": int(df.shape[1])},
        "columns": {},
        "missing_total": int(df.isnull().sum().sum()),
        "duplicate_rows": int(df.duplicated().sum()),
    }

    for col in df.columns:
        col_info = {
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isnull().sum()),
            "null_pct": round(df[col].isnull().mean() * 100, 2),
            "unique_count": int(df[col].nunique()),
        }
        if pd.api.types.is_numeric_dtype(df[col]):
            col_info["type"] = "numerical"
            col_info["stats"] = {
                "mean": round(float(df[col].mean()), 4) if not df[col].isna().all() else None,
                "median": round(float(df[col].median()), 4) if not df[col].isna().all() else None,
                "std": round(float(df[col].std()), 4) if not df[col].isna().all() else None,
                "min": round(float(df[col].min()), 4) if not df[col].isna().all() else None,
                "max": round(float(df[col].max()), 4) if not df[col].isna().all() else None,
            }
        elif pd.api.types.is_datetime64_any_dtype(df[col]):
            col_info["type"] = "datetime"
        else:
            col_info["type"] = "categorical"
            col_info["top_values"] = df[col].value_counts().head(5).to_dict()
        summary["columns"][col] = col_info

    return summary
