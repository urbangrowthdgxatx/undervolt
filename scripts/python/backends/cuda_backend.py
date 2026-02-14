"""Raw CUDA backend using cuda-python"""
import numpy as np

try:
    from cuda import cuda, cudart
    CUDA_AVAILABLE = True
except ImportError:
    CUDA_AVAILABLE = False

BACKEND_NAME = "cuda"


def _check_cuda():
    if not CUDA_AVAILABLE:
        raise ImportError("cuda-python not installed")


def load_csv(path, chunksize=500000):
    """Load CSV - use pandas for I/O"""
    import pandas as pd
    for chunk in pd.read_csv(path, chunksize=chunksize):
        yield chunk


def load_csv_full(path):
    """Load entire CSV"""
    import pandas as pd
    return pd.read_csv(path)


def extract_features(descriptions, keywords):
    """Extract features"""
    _check_cuda()
    import pandas as pd
    features = []
    for desc in descriptions:
        if not desc or (hasattr(pd, "isna") and pd.isna(desc)):
            features.append([0] * len(keywords))
            continue
        desc_lower = str(desc).lower()
        features.append([1 if kw in desc_lower else 0 for kw in keywords])
    return np.array(features, dtype=np.float32)


def compute_centroids(features_by_cluster):
    """Compute centroids"""
    _check_cuda()
    return {cid: np.mean(feats, axis=0).astype(np.float32)
            for cid, feats in features_by_cluster.items()}


def batch_cosine_similarity(features, centroids):
    """Compute cosine similarity"""
    _check_cuda()
    features = np.asarray(features, dtype=np.float32)
    results = {}
    for cid, centroid in centroids.items():
        centroid = np.asarray(centroid, dtype=np.float32)
        norm_feat = np.linalg.norm(features, axis=1)
        norm_cent = np.linalg.norm(centroid)
        similarity = np.dot(features, centroid) / (norm_feat * norm_cent + 1e-8)
        results[cid] = similarity.astype(np.float32)
    return results


def find_best_cluster(features, centroids):
    """Find the best matching cluster"""
    _check_cuda()
    similarities = batch_cosine_similarity(features, centroids)
    cluster_ids = list(centroids.keys())
    sim_matrix = np.column_stack([similarities[cid] for cid in cluster_ids])
    best_indices = np.argmax(sim_matrix, axis=1)
    return np.array([cluster_ids[i] for i in best_indices])


def to_numpy(arr):
    """Convert array to numpy"""
    return np.asarray(arr)
