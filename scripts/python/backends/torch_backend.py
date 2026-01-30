"""PyTorch GPU backend - tensor operations"""
import numpy as np

try:
    import torch
    TORCH_AVAILABLE = True
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
except (ImportError, ValueError, OSError) as e:
    TORCH_AVAILABLE = False
    DEVICE = None
    raise ImportError(f"PyTorch not available: {e}")

BACKEND_NAME = "torch"


def get_device():
    return DEVICE


def load_csv(path, chunksize=500000):
    import pandas as pd
    for chunk in pd.read_csv(path, chunksize=chunksize):
        yield chunk


def load_csv_full(path):
    import pandas as pd
    return pd.read_csv(path)


def extract_features(descriptions, keywords):
    import pandas as pd
    features = []
    for desc in descriptions:
        if not desc or (hasattr(pd, "isna") and pd.isna(desc)):
            features.append([0] * len(keywords))
            continue
        desc_lower = str(desc).lower()
        features.append([1 if kw in desc_lower else 0 for kw in keywords])
    return torch.tensor(features, dtype=torch.float32, device=DEVICE)


def compute_centroids(features_by_cluster):
    centroids = {}
    for cid, feats in features_by_cluster.items():
        if isinstance(feats, torch.Tensor):
            feats_t = feats.to(DEVICE)
        else:
            feats_t = torch.tensor(feats, dtype=torch.float32, device=DEVICE)
        centroids[cid] = feats_t.mean(dim=0)
    return centroids


def batch_cosine_similarity(features, centroids):
    if isinstance(features, torch.Tensor):
        features_t = features.to(DEVICE)
    else:
        features_t = torch.tensor(features, dtype=torch.float32, device=DEVICE)

    results = {}
    for cid, centroid in centroids.items():
        if isinstance(centroid, torch.Tensor):
            centroid_t = centroid.to(DEVICE)
        else:
            centroid_t = torch.tensor(centroid, dtype=torch.float32, device=DEVICE)
        similarity = torch.nn.functional.cosine_similarity(
            features_t, centroid_t.unsqueeze(0), dim=1
        )
        results[cid] = similarity.cpu().numpy()
    return results


def find_best_cluster(features, centroids):
    if isinstance(features, torch.Tensor):
        features_t = features.to(DEVICE)
    else:
        features_t = torch.tensor(features, dtype=torch.float32, device=DEVICE)

    cluster_ids = list(centroids.keys())
    centroid_list = []
    for cid in cluster_ids:
        cent = centroids[cid]
        if isinstance(cent, torch.Tensor):
            centroid_list.append(cent.to(DEVICE))
        else:
            centroid_list.append(torch.tensor(cent, dtype=torch.float32, device=DEVICE))
    centroid_matrix = torch.stack(centroid_list)

    features_normed = torch.nn.functional.normalize(features_t, dim=1)
    centroids_normed = torch.nn.functional.normalize(centroid_matrix, dim=1)

    sim_matrix = torch.mm(features_normed, centroids_normed.T)
    best_indices = torch.argmax(sim_matrix, dim=1)

    best_indices_cpu = best_indices.cpu().numpy()
    return np.array([cluster_ids[i] for i in best_indices_cpu])


def to_numpy(arr):
    if isinstance(arr, torch.Tensor):
        return arr.cpu().numpy()
    return np.asarray(arr)
