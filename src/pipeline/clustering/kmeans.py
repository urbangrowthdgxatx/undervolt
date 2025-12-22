"""Clustering utilities"""
import logging
import pandas as pd
from ..config import GPU_ENABLED, CLUSTERING_PARAMS

log = logging.getLogger("permits")

# Try importing cuML (GPU clustering)
CUML_CLUSTERING_AVAILABLE = False
try:
    from cuml.cluster import KMeans as cuKMeans
    from cuml.preprocessing import StandardScaler as cuStandardScaler
    from cuml.decomposition import PCA as cuPCA
    CUML_CLUSTERING_AVAILABLE = True
except Exception:
    from sklearn.cluster import KMeans as cuKMeans
    from sklearn.preprocessing import StandardScaler as cuStandardScaler
    from sklearn.decomposition import PCA as cuPCA

if GPU_ENABLED:
    import cudf


def run_cuml_clustering(df, feature_prefix=None):
    """
    Run KMeans clustering on NLP features

    Args:
        df: DataFrame with NLP features
        feature_prefix: Prefix for feature columns (default from config)

    Returns:
        DataFrame with added f_cluster column
    """
    if feature_prefix is None:
        feature_prefix = CLUSTERING_PARAMS["feature_prefix"]

    mode = "GPU (cuML)" if CUML_CLUSTERING_AVAILABLE else "CPU (sklearn)"
    log.info(f"⚡ Running {mode} clustering on NLP features...")

    # Pick only the features created by NLP
    feature_cols = [c for c in df.columns if c.startswith(feature_prefix)]

    if len(feature_cols) == 0:
        log.warning("No NLP feature columns found for clustering")
        return df

    # Convert to CPU pandas if needed for sklearn
    if not CUML_CLUSTERING_AVAILABLE and GPU_ENABLED:
        X = df[feature_cols].to_pandas().astype("float32")
    else:
        X = df[feature_cols].astype("float32")

    # Scale
    scaler = cuStandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Dimensionality reduction (optional but recommended)
    n_samples = len(X)
    n_components = min(
        CLUSTERING_PARAMS["n_pca_components"],
        len(feature_cols),
        n_samples
    )

    if n_components < 2:
        log.warning(f"Too few components ({n_components}) for PCA, using raw features")
        X_pca = X_scaled
    else:
        pca = cuPCA(n_components=n_components)
        X_pca = pca.fit_transform(X_scaled)

    # KMeans (ensure n_clusters <= n_samples)
    n_clusters = min(CLUSTERING_PARAMS["n_clusters"], n_samples)
    if n_clusters < 2:
        log.warning(f"Too few samples ({n_samples}) for clustering, skipping")
        df["f_cluster"] = 0
        return df

    kmeans = cuKMeans(n_clusters=n_clusters, max_iter=CLUSTERING_PARAMS["max_iter"])
    clusters = kmeans.fit_predict(X_pca)

    # Convert back to appropriate format
    if CUML_CLUSTERING_AVAILABLE:
        df["f_cluster"] = clusters
    elif GPU_ENABLED:
        df["f_cluster"] = cudf.from_pandas(pd.Series(clusters))
    else:
        df["f_cluster"] = clusters

    log.info("Clustering complete. Added column 'f_cluster'.")
    return df
