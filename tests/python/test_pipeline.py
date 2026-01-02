"""Smoke test for unified pipeline with sample dataset."""
from pathlib import Path
import os

from src.pipeline.data_unified import load_and_clean


def test_pipeline_smoke(tmp_path):
    os.environ["TEST_MODE"] = "1"
    sample_path = Path(__file__).parent / "test_permits.csv"
    csv_path = tmp_path / "test_permits.csv"
    csv_path.write_bytes(sample_path.read_bytes())

    df = load_and_clean(csv_path)

    assert len(df) > 0
    assert {"zip_code", "latitude", "longitude"}.issubset(df.columns)
