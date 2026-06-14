import pandas as pd
import numpy as np


def clean_data(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    """Clean dataframe, return cleaned df + list of actions taken."""
    actions = []
    df = df.copy()

    # Remove duplicates
    before = len(df)
    df = df.drop_duplicates()
    dropped = before - len(df)
    if dropped > 0:
        actions.append({"action": "remove_duplicates", "detail": f"Removed {dropped} duplicate rows"})

    # Fix numeric columns stored as strings
    for col in df.columns:
        if df[col].dtype == object:
            try:
                converted = pd.to_numeric(df[col].str.replace(',', ''), errors='coerce')
                if converted.notna().sum() > len(df) * 0.8:
                    df[col] = converted
                    actions.append({"action": "type_fix", "detail": f"Converted '{col}' from string to numeric"})
            except Exception:
                pass

    # Handle missing values
    for col in df.columns:
        null_pct = df[col].isnull().mean()
        if null_pct == 0:
            continue
        if null_pct > 0.6:
            df = df.drop(columns=[col])
            actions.append({"action": "drop_column", "detail": f"Dropped '{col}' — {null_pct*100:.1f}% missing"})
        elif pd.api.types.is_numeric_dtype(df[col]):
            median_val = df[col].median()
            df[col] = df[col].fillna(median_val)
            actions.append({"action": "impute_median", "detail": f"Filled {df[col].isnull().sum()} nulls in '{col}' with median ({median_val:.2f})"})
        else:
            mode_val = df[col].mode()[0] if not df[col].mode().empty else "Unknown"
            df[col] = df[col].fillna(mode_val)
            actions.append({"action": "impute_mode", "detail": f"Filled nulls in '{col}' with mode ('{mode_val}')"})

    # Outlier capping (IQR)
    for col in df.select_dtypes(include=[np.number]).columns:
        Q1, Q3 = df[col].quantile(0.25), df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower, upper = Q1 - 1.5 * IQR, Q3 + 1.5 * IQR
        outliers = ((df[col] < lower) | (df[col] > upper)).sum()
        if outliers > 0:
            df[col] = df[col].clip(lower, upper)
            actions.append({"action": "outlier_cap", "detail": f"Capped {outliers} outliers in '{col}' to IQR range [{lower:.2f}, {upper:.2f}]"})

    return df, actions
