"""
Unified Clustering

Platform-aware KMeans clustering that automatically uses:
- cuML (GPU) on Jetson/DGX if installed
- scikit-learn (CPU) as fallback
"""

import logging
from typing import Union

from .platform import get_config

# Try importing both backends
try:
    from cuml.cluster import KMeans as cuMLKMeans
    from cuml.preprocessing import StandardScaler as cuMLScaler
    from cuml.decomposition import PCA as cuMLPCA
    CUML_AVAILABLE = True
except ImportError:
    CUML_AVAILABLE = False

from sklearn.cluster import KMeans as SklearnKMeans
from sklearn.preprocessing import StandardScaler as SklearnScaler
from sklearn.decomposition import PCA as SklearnPCA

log = logging.getLogger(__name__)


class UnifiedClustering:
    """
    Platform-aware KMeans clustering.

    Automatically uses cuML on GPU platforms, sklearn on CPU.
    """

    def __init__(
        self,
        n_clusters: int = 8,
        n_pca_components: int = 10,
        max_iter: int = 300,
        random_state: int = 42
    ):
        self.config = get_config()
        self.n_clusters = n_clusters
        self.n_pca_components = n_pca_components
        self.max_iter = max_iter
        self.random_state = random_state

        # Select backend
        self.use_cuml = self.config.use_cuml and CUML_AVAILABLE

        if self.use_cuml:
            self.scaler_cls = cuMLScaler
            self.pca_cls = cuMLPCA
            self.kmeans_cls = cuMLKMeans
            self.backend = "cuML (GPU)"
        else:
            self.scaler_cls = SklearnScaler
            self.pca_cls = SklearnPCA
            self.kmeans_cls = SklearnKMeans
            self.backend = "scikit-learn (CPU)"

        log.info(f"🎯 Clustering backend: {self.backend}")

    def fit_predict(self, df, feature_columns):
        """
        Run KMeans clustering on feature columns.

        Pipeline:
        1. StandardScaler normalization
        2. PCA dimensionality reduction
        3. KMeans clustering

        Args:
            df: DataFrame with feature columns
            feature_columns: List of column names to use for clustering

        Returns:
            Cluster labels (0 to n_clusters-1)
        """
        import time
        start = time.time()

        log.info(f"Clustering on {len(feature_columns)} features...")

        # Extract features
        X = df[feature_columns]

        # Convert to appropriate format
        if self.use_cuml:
            # Ensure cuDF DataFrame
            if not hasattr(X, 'to_pandas'):
                import cudf
                X = cudf.from_pandas(X)
        else:
            # Ensure pandas DataFrame
            if hasattr(X, 'to_pandas'):
                X = X.to_pandas()
            # Convert to numpy for sklearn
            X = X.values

        # Step 1: Standardize features
        log.info("  1/3 Standardizing features...")
        scaler = self.scaler_cls()
        X_scaled = scaler.fit_transform(X)

        # Step 2: PCA dimensionality reduction
        log.info(f"  2/3 PCA ({len(feature_columns)} → {self.n_pca_components} components)...")
        pca = self.pca_cls(n_components=self.n_pca_components)
        X_pca = pca.fit_transform(X_scaled)

        # Step 3: KMeans clustering
        log.info(f"  3/3 KMeans (k={self.n_clusters})...")
        if self.use_cuml:
            kmeans = self.kmeans_cls(
                n_clusters=self.n_clusters,
                max_iter=self.max_iter,
                random_state=self.random_state
            )
        else:
            kmeans = self.kmeans_cls(
                n_clusters=self.n_clusters,
                max_iter=self.max_iter,
                random_state=self.random_state,
                n_init='auto'  # sklearn 1.4+ parameter
            )

        labels = kmeans.fit_predict(X_pca)

        elapsed = time.time() - start
        log.info(f"✅ Clustering complete in {elapsed:.2f}s")

        return labels

    def add_clusters_to_df(self, df, feature_prefix: str = 'f_'):
        """
        Add cluster column to DataFrame.

        Args:
            df: DataFrame with feature columns (f_*)
            feature_prefix: Prefix for feature columns

        Returns:
            DataFrame with 'f_cluster' column added
        """
        # Find feature columns
        feature_cols = [c for c in df.columns if c.startswith(feature_prefix) and c != 'f_cluster']

        if not feature_cols:
            raise ValueError(f"No feature columns found with prefix '{feature_prefix}'")

        log.info(f"Found {len(feature_cols)} feature columns")

        # Run clustering
        labels = self.fit_predict(df, feature_cols)

        # Add to DataFrame
        df['f_cluster'] = labels

        # Print distribution
        self._print_distribution(df['f_cluster'])

        return df

    def _print_distribution(self, labels):
        """Print cluster distribution"""
        if hasattr(labels, 'value_counts'):
            # pandas/cudf series
            counts = labels.value_counts().sort_index()
        else:
            # numpy array
            import numpy as np
            unique, counts_arr = np.unique(labels, return_counts=True)
            counts = dict(zip(unique, counts_arr))

        total = len(labels)
        log.info("Cluster distribution:")
        for cluster_id in sorted(counts.keys() if isinstance(counts, dict) else counts.index):
            count = counts[cluster_id] if isinstance(counts, dict) else counts[cluster_id]
            pct = (count / total) * 100
            log.info(f"  Cluster {cluster_id}: {count:,} ({pct:.1f}%)")


def cluster_data(df, n_clusters: int = 8, feature_prefix: str = 'f_'):
    """
    Convenience function to cluster DataFrame.

    Args:
        df: DataFrame with feature columns
        n_clusters: Number of clusters (default: 8)
        feature_prefix: Feature column prefix (default: 'f_')

    Returns:
        DataFrame with 'f_cluster' column
    """
    clusterer = UnifiedClustering(n_clusters=n_clusters)
    return clusterer.add_clusters_to_df(df, feature_prefix=feature_prefix)


if __name__ == "__main__":
    # Test clustering
    import pandas as pd
    import numpy as np

    logging.basicConfig(level=logging.INFO)

    from .platform import print_platform_info
    print_platform_info()

    # Create test data
    print("\nCreating test dataset...")
    np.random.seed(42)
    df = pd.DataFrame({
        'f_feature_1': np.random.randn(1000),
        'f_feature_2': np.random.randn(1000),
        'f_feature_3': np.random.randn(1000),
        'f_feature_4': np.random.randn(1000),
        'f_feature_5': np.random.randn(1000),
    })

    # Test clustering
    df = cluster_data(df, n_clusters=3)
    print(f"\n✅ Clustered {len(df):,} rows")
    print(f"Cluster column added: {'f_cluster' in df.columns}")
