"""NLP feature extraction"""
import logging
from ..config import NLP_KEYWORDS

log = logging.getLogger("permits")


def nlp_enrich(df, text_cols):
    """
    Extract NLP keyword features from text columns

    Creates binary features indicating presence of keywords in text columns.
    For each text column and keyword, creates a column like: f_{col}_kw_{keyword}

    Args:
        df: DataFrame with text columns
        text_cols: List of column names to search

    Returns:
        DataFrame with added NLP feature columns
    """
    log.info("🧠 Running GPU NLP keyword extraction...")

    for col in text_cols:
        if col not in df.columns:
            log.warning(f"Skipping missing text column: {col}")
            continue

        safe_col = df[col].fillna("").str.lower()

        for kw in NLP_KEYWORDS:
            df[f"f_{col}_kw_{kw}"] = safe_col.str.contains(
                kw.lower(), regex=False
            ).astype(int)

    log.info("NLP enrichment complete.")
    return df
