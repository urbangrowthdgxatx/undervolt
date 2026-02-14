"""cuPy GPU backend - drop-in replacement for numpy operations"""
import cupy as cp
import numpy as np

BACKEND_NAME = "cupy"


def load_csv(path, chunksize=500000):
    """Load CSV - use pandas, transfer to GPU for processing"""
    import pandas as pd
    for chunk in pd.read_csv(path, chunksize=chunksize):
        yield chunk


def load_csv_full(path):
    """Load entire CSV into memory"""
    import pandas as pd
    return pd.read_csv(path)


def extract_features(descriptions, keywords):
    """GPU-accelerated feature extraction"""
    import pandas as pd
    features = []
    for desc in descriptions:
        if not desc or (hasattr(pd, "isna") and pd.isna(desc)):
            features.append([0] * len(keywords))
            continue
        desc_lower = str(desc).lower()
        features.append([1 if kw in desc_lower else 0 for kw in keywords])
    return cp.array(features, dtype=cp.float32)


def compute_centroids(features_by_cluster):
    """GPU centroid computation"""
    centroids = {}
    for cid, feats in features_by_cluster.items():
        feats_gpu = cp.array(feats) if not isinstance(feats, cp.ndarray) else feats
        centroids[cid] = cp.mean(feats_gpu, axis=0)
    return centroids


def batch_cosine_similarity(features, centroids):
    """GPU batch cosine similarity"""
    features_gpu = cp.array(features) if not isinstance(features, cp.ndarray) else features
    results = {}
    for cid, centroid in centroids.items():
        centroid_gpu = cp.array(centroid) if not isinstance(centroid, cp.ndarray) else centroid
        norm_feat = cp.linalg.norm(features_gpu, axis=1)
        norm_cent = cp.linalg.norm(centroid_gpu)
        similarity = cp.dot(features_gpu, centroid_gpu) / (norm_feat * norm_cent + 1e-8)
        results[cid] = cp.asnumpy(similarity)
    return results


def find_best_cluster(features, centroids):
    """Find the best matching cluster (GPU accelerated)"""
    features_gpu = cp.array(features) if not isinstance(features, cp.ndarray) else features
    cluster_ids = list(centroids.keys())

    centroid_matrix = cp.stack([
        cp.array(centroids[cid]) if not isinstance(centroids[cid], cp.ndarray) else centroids[cid]
        for cid in cluster_ids
    ])

    feat_norms = cp.linalg.norm(features_gpu, axis=1, keepdims=True)
    cent_norms = cp.linalg.norm(centroid_matrix, axis=1, keepdims=True)

    features_normed = features_gpu / (feat_norms + 1e-8)
    centroids_normed = centroid_matrix / (cent_norms + 1e-8)

    sim_matrix = cp.dot(features_normed, centroids_normed.T)
    best_indices = cp.argmax(sim_matrix, axis=1)

    best_indices_cpu = cp.asnumpy(best_indices)
    return np.array([cluster_ids[i] for i in best_indices_cpu])


def to_numpy(arr):
    """Convert cupy array to numpy"""
    if isinstance(arr, cp.ndarray):
        return cp.asnumpy(arr)
    return np.asarray(arr)
