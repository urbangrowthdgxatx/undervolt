"""Data analysis utilities"""
import logging

log = logging.getLogger("permits")


def analyze(df):
    """
    Analyze permits by ZIP code

    Args:
        df: DataFrame with permit data

    Returns:
        DataFrame grouped by zip_code with permit counts
    """
    if "zip_code" not in df:
        log.warning("Missing zip_code — cannot group.")
        return None

    grouped = df.groupby("zip_code").size()
    grouped = grouped.reset_index().rename(columns={0: "permit_count"})

    return grouped.sort_values("permit_count", ascending=False)
