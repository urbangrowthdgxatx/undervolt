"""Data loading utilities"""
import time
import logging
from ..config import GPU_ENABLED

log = logging.getLogger("permits")

if GPU_ENABLED:
    import cudf
import pandas as pd


def load_data(path: str):
    """
    Load CSV data from path using cuDF (GPU) or pandas (CPU)

    Args:
        path: Path to CSV file

    Returns:
        DataFrame (cuDF or pandas depending on GPU availability)
    """
    start = time.time()
    log.info(f"Loading CSV → {path}")

    if GPU_ENABLED:
        df = cudf.read_csv(path)
    else:
        df = pd.read_csv(path)

    log.info(f"Loaded {len(df):,} rows in {time.time() - start:.2f}s")
    return df


def save_results(df, outpath):
    """
    Save DataFrame to CSV

    Args:
        df: DataFrame to save
        outpath: Output file path
    """
    if df is None:
        log.warning("Nothing to save.")
        return

    df.to_csv(outpath, index=False)
    log.info(f"Saved results → {outpath}")
