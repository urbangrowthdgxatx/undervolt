#!/usr/bin/env python3
"""
Assign clusters to unclustered permits using NLP keyword features + nearest centroid.

1. Fetches existing cluster centroids (from already-clustered permits)
2. Loads unclustered permits from Supabase
3. Extracts NLP keyword features from work_description
4. Assigns each to the nearest cluster via cosine distance to centroids
5. Updates permits in Supabase
6. Re-aggregates cluster counts

Usage:
    python3 scripts/python/cluster_new_permits.py
"""

import os
import sys
import time
import numpy as np
import psycopg2
from psycopg2.extras import execute_values

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:8wmyMwzl2tfj0Rck@db.arpoymzcflsqcaqixhie.supabase.co:5432/postgres"
)

NLP_KEYWORDS = [
    "residential", "commercial", "remodel", "repair", "new", "demolition",
    "foundation", "roof", "window", "permit", "hvac", "electrical",
    "plumbing", "mechanical", "multi-family", "single-family"
]

BATCH_SIZE = 2000


def extract_features(description):
    """Extract 16 binary keyword features from a description string."""
    if not description:
        return [0] * len(NLP_KEYWORDS)
    desc = description.lower()
    return [1 if kw in desc else 0 for kw in NLP_KEYWORDS]


def compute_centroids(conn):
    """Compute cluster centroids from existing clustered permits."""
    print("[Step 1] Computing cluster centroids from existing permits...")
    cur = conn.cursor()

    # Sample clustered permits to compute centroids (full scan is too slow)
    # Use a representative sample per cluster
    centroids = {}
    cur.execute("SELECT DISTINCT cluster_id FROM permits WHERE cluster_id IS NOT NULL ORDER BY cluster_id")
    cluster_ids = [row[0] for row in cur.fetchall()]

    for cid in cluster_ids:
        cur.execute(
            "SELECT work_description FROM permits WHERE cluster_id = %s AND work_description IS NOT NULL LIMIT 5000",
            (cid,)
        )
        descriptions = [row[0] for row in cur.fetchall()]

        if not descriptions:
            continue

        # Extract features for all sampled permits
        features = np.array([extract_features(d) for d in descriptions], dtype=np.float32)
        centroid = features.mean(axis=0)
        centroids[cid] = centroid
        top_kws = [(NLP_KEYWORDS[i], centroid[i]) for i in np.argsort(-centroid)[:3]]
        top_str = ", ".join(f"{kw}={score:.2f}" for kw, score in top_kws)
        print(f"  Cluster {cid}: {len(descriptions)} samples, top: {top_str}")

    print(f"  Computed {len(centroids)} centroids")
    return centroids


def assign_nearest_cluster(features, centroids):
    """Assign a feature vector to the nearest cluster centroid (cosine similarity)."""
    feat = np.array(features, dtype=np.float32)
    feat_norm = np.linalg.norm(feat)

    if feat_norm == 0:
        # No keywords matched — assign to largest cluster (1: General Construction)
        return 1

    best_cluster = 1
    best_sim = -1

    for cid, centroid in centroids.items():
        c_norm = np.linalg.norm(centroid)
        if c_norm == 0:
            continue
        sim = np.dot(feat, centroid) / (feat_norm * c_norm)
        if sim > best_sim:
            best_sim = sim
            best_cluster = cid

    return best_cluster


def cluster_unclustered(conn, centroids):
    """Fetch unclustered permits, assign clusters, update DB."""
    cur = conn.cursor()

    # Get all unclustered permits
    print("[Step 2] Loading unclustered permits...")
    cur.execute("SELECT id, permit_number, work_description FROM permits WHERE cluster_id IS NULL")
    rows = cur.fetchall()
    print(f"  Found {len(rows):,} unclustered permits")

    if not rows:
        print("  Nothing to do!")
        return 0

    # Assign clusters
    print("[Step 3] Assigning clusters via nearest centroid...")
    updates = []
    cluster_counts = {}
    start = time.time()

    for row_id, permit_number, description in rows:
        features = extract_features(description)
        cluster_id = assign_nearest_cluster(features, centroids)
        updates.append((cluster_id, row_id))

        cluster_counts[cluster_id] = cluster_counts.get(cluster_id, 0) + 1

    elapsed = time.time() - start
    print(f"  Assigned {len(updates):,} permits in {elapsed:.1f}s")
    for cid in sorted(cluster_counts):
        print(f"    Cluster {cid}: {cluster_counts[cid]:,} new permits")

    # Batch update
    print("[Step 4] Updating Supabase...")
    start = time.time()
    total = 0

    for i in range(0, len(updates), BATCH_SIZE):
        batch = updates[i:i + BATCH_SIZE]
        execute_values(
            cur,
            "UPDATE permits SET cluster_id = data.cluster_id FROM (VALUES %s) AS data(cluster_id, id) WHERE permits.id = data.id",
            batch
        )
        total += len(batch)
        if total % 10000 == 0:
            conn.commit()
            print(f"    Updated {total:,}...")

    conn.commit()
    elapsed = time.time() - start
    print(f"  Updated {total:,} permits in {elapsed:.1f}s")
    return total


def update_cluster_counts(conn):
    """Re-aggregate cluster counts and percentages."""
    print("[Step 5] Updating cluster counts...")
    cur = conn.cursor()
    cur.execute("""
        UPDATE clusters c SET
            count = sub.cnt,
            percentage = ROUND((sub.cnt::numeric / total.total * 100)::numeric, 1)
        FROM (
            SELECT cluster_id, count(*) as cnt
            FROM permits
            WHERE cluster_id IS NOT NULL
            GROUP BY cluster_id
        ) sub,
        (SELECT count(*) as total FROM permits WHERE cluster_id IS NOT NULL) total
        WHERE c.id = sub.cluster_id
    """)
    conn.commit()

    # Print updated counts
    cur.execute("SELECT id, name, count, percentage FROM clusters ORDER BY id")
    for row in cur.fetchall():
        print(f"  Cluster {row[0]}: {row[1]} — {row[2]:,} ({row[3]}%)")


def main():
    print("=" * 60)
    print("Cluster Assignment for New Permits")
    print("=" * 60)
    start = time.time()

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False

    try:
        centroids = compute_centroids(conn)
        count = cluster_unclustered(conn, centroids)
        if count > 0:
            update_cluster_counts(conn)

        elapsed = time.time() - start
        print("=" * 60)
        print(f"Done in {elapsed:.0f}s — {count:,} permits clustered")
        print("=" * 60)
    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
