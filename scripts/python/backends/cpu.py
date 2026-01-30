"""CPU backend - pandas/numpy implementation"""
import numpy as np

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    pd = None
    PANDAS_AVAILABLE = False

BACKEND_NAME = "cpu"


def _is_null(value):
    """Check if value is null/None/NaN"""
    if value is None:
        return True
    if PANDAS_AVAILABLE and pd.isna(value):
        return True
    try:
        if isinstance(value, float) and np.isnan(value):
            return True
    except (TypeError, ValueError):
        pass
    return False


def load_csv(path, chunksize=500000):
    """Load CSV in chunks"""
    if not PANDAS_AVAILABLE:
        raise ImportError("pandas required for CSV loading")
    return pd.read_csv(path, chunksize=chunksize)


def load_csv_full(path):
    """Load entire CSV into memory"""
    if not PANDAS_AVAILABLE:
        raise ImportError("pandas required for CSV loading")
    return pd.read_csv(path)


def extract_features(descriptions, keywords):
    """Extract keyword features from descriptions"""
    features = []
    for desc in descriptions:
        if not desc or _is_null(desc):
            features.append([0] * len(keywords))
            continue
        desc_lower = str(desc).lower()
        features.append([1 if kw in desc_lower else 0 for kw in keywords])
    return np.array(features, dtype=np.float32)


def compute_centroids(features_by_cluster):
    """Compute cluster centroids"""
    return {cid: np.mean(feats, axis=0) for cid, feats in features_by_cluster.items()}


def batch_cosine_similarity(features, centroids):
    """Compute cosine similarity to all centroids"""
    results = {}
    for cid, centroid in centroids.items():
        norm_feat = np.linalg.norm(features, axis=1)
        norm_cent = np.linalg.norm(centroid)
        similarity = np.dot(features, centroid) / (norm_feat * norm_cent + 1e-8)
        results[cid] = similarity
    return results


def find_best_cluster(features, centroids):
    """Find the best matching cluster for each feature vector"""
    similarities = batch_cosine_similarity(features, centroids)
    cluster_ids = list(centroids.keys())
    sim_matrix = np.column_stack([similarities[cid] for cid in cluster_ids])
    best_indices = np.argmax(sim_matrix, axis=1)
    return np.array([cluster_ids[i] for i in best_indices])


def to_numpy(arr):
    """Convert array to numpy"""
    return np.asarray(arr)
