"""
Unified Data Loading and Cleaning

Single implementation that automatically uses GPU (cuDF) or CPU (pandas)
based on platform detection. No more duplicate code!
"""

import os
import logging
from pathlib import Path
from typing import Union

# Platform-aware imports
from .platform import get_config

# Try importing both backends
try:
    import cudf as df_lib
    DataFrame = df_lib.DataFrame
    GPU_AVAILABLE = True
except ImportError:
    import pandas as df_lib
    from pandas import DataFrame
    GPU_AVAILABLE = False

log = logging.getLogger(__name__)


class UnifiedDataLoader:
    """
    Platform-aware data loader.

    Automatically uses:
    - cuDF on Jetson/DGX if installed
    - pandas on Mac or as fallback
    """

    def __init__(self):
        self.config = get_config()
        self.backend = "cuDF (GPU)" if self.config.use_cudf and GPU_AVAILABLE else "pandas (CPU)"
        log.info(f"📊 Data backend: {self.backend}")

    def load_csv(self, path: Union[str, Path], **kwargs) -> DataFrame:
        """
        Load CSV with platform-optimized settings.

        Args:
            path: Path to CSV file
            **kwargs: Additional arguments for read_csv

        Returns:
            DataFrame (cuDF or pandas depending on platform)
        """
        path = str(path)

        if not os.path.exists(path):
            raise FileNotFoundError(f"Data file not found: {path}")

        # Set default kwargs
        default_kwargs = {
            'low_memory': False,  # pandas only, ignored by cuDF
        }
        default_kwargs.update(kwargs)

        log.info(f"Loading CSV: {path}")
        log.info(f"Backend: {self.backend}")

        import time
        start = time.time()

        df = df_lib.read_csv(path, **default_kwargs)

        elapsed = time.time() - start
        log.info(f"✅ Loaded {len(df):,} rows in {elapsed:.2f}s")

        return df

    def to_pandas(self, df: DataFrame):
        """Convert to pandas if needed (for compatibility)"""
        if self.config.use_cudf and hasattr(df, 'to_pandas'):
            return df.to_pandas()
        return df

    def to_gpu(self, df):
        """Convert to cuDF if available"""
        if self.config.use_cudf and not hasattr(df, 'to_pandas'):
            import cudf
            return cudf.from_pandas(df)
        return df


class UnifiedDataCleaner:
    """
    Platform-aware data cleaner.

    Works with both cuDF and pandas DataFrames.
    """

    def __init__(self):
        self.config = get_config()
        self.backend = "cuDF (GPU)" if self.config.use_cudf and GPU_AVAILABLE else "pandas (CPU)"

    def clean(self, df: DataFrame) -> DataFrame:
        """
        Clean and normalize permit data.

        Steps:
        1. Normalize column names (lowercase)
        2. Remove invalid lat/lng
        3. Parse dates
        4. Convert numeric columns
        5. Extract ZIP codes

        Args:
            df: Raw permit DataFrame

        Returns:
            Cleaned DataFrame
        """
        log.info("🧹 Starting data cleaning...")
        initial_count = len(df)

        # 1. Normalize column names to lowercase
        df.columns = [c.lower() for c in df.columns]
        log.info(f"  ✓ Normalized column names")

        # 2. Filter invalid coordinates
        df = self._filter_coordinates(df)
        removed = initial_count - len(df)
        log.info(f"  Removed {removed:,} permits with invalid coordinates")

        # 3. Parse date columns
        df = self._parse_dates(df)
        log.info(f"  ✓ Parsed date columns")

        # 4. Convert numeric columns
        df = self._convert_numeric(df)
        log.info(f"  ✓ Converted numeric columns")

        # 5. Extract ZIP codes
        df = self._extract_zip(df)
        log.info(f"  ✓ Extracted ZIP codes")

        log.info(f"✅ Cleaning complete: {len(df):,} permits")
        return df

    def _filter_coordinates(self, df: DataFrame) -> DataFrame:
        """Remove permits with invalid lat/lng"""
        # Austin bounds: roughly 30.0-30.6 lat, -98.0 to -97.5 lng
        lat_valid = (df['latitude'] >= 30.0) & (df['latitude'] <= 30.6)
        lng_valid = (df['longitude'] >= -98.0) & (df['longitude'] <= -97.5)

        return df[lat_valid & lng_valid].reset_index(drop=True)

    def _parse_dates(self, df: DataFrame) -> DataFrame:
        """Parse date columns"""
        date_columns = [
            'applied_date', 'issued_date', 'status_date',
            'expires_date', 'completed_date'
        ]

        for col in date_columns:
            if col in df.columns:
                try:
                    if self.config.use_cudf and GPU_AVAILABLE:
                        # cuDF datetime parsing
                        import cudf
                        df[col] = cudf.to_datetime(df[col], errors='coerce')
                    else:
                        # pandas datetime parsing
                        import pandas as pd
                        df[col] = pd.to_datetime(df[col], errors='coerce')
                except Exception as e:
                    log.warning(f"Could not parse date column {col}: {e}")

        return df

    def _convert_numeric(self, df: DataFrame) -> DataFrame:
        """Convert numeric columns"""
        numeric_columns = [
            'total_existing_bldg_sqft', 'remodel_repair_sqft',
            'total_new_add_sqft', 'total_valuation_remodel',
            'total_job_valuation', 'number_of_floors', 'housing_units',
            'building_valuation', 'building_valuation_remodel',
            'electrical_valuation', 'electrical_valuation_remodel',
            'mechanical_valuation', 'mechanical_valuation_remodel',
            'plumbing_valuation', 'plumbing_valuation_remodel',
            'medgas_valuation', 'medgas_valuation_remodel', 'total_lot_sqft'
        ]

        for col in numeric_columns:
            if col in df.columns:
                try:
                    if self.config.use_cudf and GPU_AVAILABLE:
                        df[col] = df[col].astype('float32')
                    else:
                        import pandas as pd
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                except:
                    pass

        return df

    def _extract_zip(self, df: DataFrame) -> DataFrame:
        """Extract ZIP code from multiple source columns"""
        zip_sources = ['original_zip', 'contractor_zip', 'applicant_zip']

        # Try each source column in order
        df['zip_code'] = None
        for source in zip_sources:
            if source in df.columns:
                # Fill missing values from this source
                mask = df['zip_code'].isna()
                if mask.any():
                    df.loc[mask, 'zip_code'] = df.loc[mask, source]

        # Convert to string and clean
        if self.config.use_cudf and GPU_AVAILABLE:
            df['zip_code'] = df['zip_code'].astype(str).str.replace('.0', '', regex=False)
        else:
            df['zip_code'] = df['zip_code'].astype(str).str.replace('.0', '', regex=False)

        # Replace 'nan' string with 'UNKNOWN'
        df.loc[df['zip_code'] == 'nan', 'zip_code'] = 'UNKNOWN'

        return df


# Convenience functions
def load_data(path: Union[str, Path], **kwargs) -> DataFrame:
    """Load CSV data with platform detection"""
    loader = UnifiedDataLoader()
    return loader.load_csv(path, **kwargs)


def clean_data(df: DataFrame) -> DataFrame:
    """Clean permit data with platform detection"""
    cleaner = UnifiedDataCleaner()
    return cleaner.clean(df)


def load_and_clean(path: Union[str, Path], **kwargs) -> DataFrame:
    """One-shot load and clean"""
    df = load_data(path, **kwargs)
    df = clean_data(df)
    return df


if __name__ == "__main__":
    # Test the unified loader
    import sys
    logging.basicConfig(level=logging.INFO)

    from .platform import print_platform_info
    print_platform_info()

    # Test with sample data
    data_path = Path(__file__).parent.parent.parent / "data" / "Issued_Construction_Permits_20251212.csv"
    if data_path.exists():
        df = load_and_clean(data_path)
        print(f"\n✅ Loaded and cleaned {len(df):,} permits")
        print(f"Columns: {list(df.columns[:5])}...")
    else:
        print(f"❌ Test data not found: {data_path}")
