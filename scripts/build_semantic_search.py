#!/usr/bin/env python3
"""
Semantic Search with Embeddings

Build a vector database for semantic permit search using sentence-transformers.
Enables queries like "solar panel installation with battery backup" to find
relevant permits even if exact keywords don't match.
"""

import pandas as pd
import numpy as np
import json
import os
from pathlib import Path

# Try to import sentence-transformers
try:
    from sentence_transformers import SentenceTransformer
    HAVE_EMBEDDINGS = True
except ImportError:
    print("⚠️  sentence-transformers not installed")
    print("   Install with: pip install sentence-transformers")
    HAVE_EMBEDDINGS = False

# Try to import faiss for fast similarity search
try:
    import faiss
    HAVE_FAISS = True
except ImportError:
    print("⚠️  faiss not installed (optional, for faster search)")
    print("   Install with: pip install faiss-cpu")
    HAVE_FAISS = False


def load_permit_data(path='output/permit_data_named_clusters.csv', sample_size=10000):
    """Load permit data"""
    print(f"Loading {sample_size:,} permits from {path}...")
    df = pd.read_csv(path, nrows=sample_size, low_memory=False)

    # Keep only relevant columns
    cols = ['description', 'zip_code', 'f_cluster', 'cluster_name']
    df = df[cols].dropna(subset=['description'])

    print(f"Loaded {len(df):,} permits with descriptions")
    return df


def create_embeddings(df, model_name='all-MiniLM-L6-v2'):
    """Create embeddings for permit descriptions"""
    print(f"\n🤖 Creating embeddings with {model_name}...")

    if not HAVE_EMBEDDINGS:
        print("❌ Cannot create embeddings without sentence-transformers")
        return None

    # Load model (small, fast, good quality)
    model = SentenceTransformer(model_name)

    # Encode descriptions
    descriptions = df['description'].tolist()

    print(f"   Encoding {len(descriptions):,} descriptions...")
    embeddings = model.encode(
        descriptions,
        batch_size=32,
        show_progress_bar=True,
        convert_to_numpy=True
    )

    print(f"✅ Created embeddings: {embeddings.shape}")
    print(f"   Dimension: {embeddings.shape[1]}")

    return embeddings


def build_faiss_index(embeddings):
    """Build FAISS index for fast similarity search"""
    print("\n🔍 Building FAISS index...")

    if not HAVE_FAISS:
        print("⚠️  Skipping FAISS index (not installed)")
        return None

    dimension = embeddings.shape[1]

    # Use L2 distance (cosine similarity after normalization)
    # Normalize embeddings first
    faiss.normalize_L2(embeddings)

    # Create index
    index = faiss.IndexFlatIP(dimension)  # Inner product (cosine after normalization)
    index.add(embeddings.astype('float32'))

    print(f"✅ Built FAISS index with {index.ntotal:,} vectors")

    return index


def search_similar(query, model, index, df, embeddings, top_k=10):
    """Search for similar permits"""
    # Encode query
    query_embedding = model.encode([query], convert_to_numpy=True)

    if HAVE_FAISS and index is not None:
        # Fast FAISS search
        faiss.normalize_L2(query_embedding)
        distances, indices = index.search(query_embedding.astype('float32'), top_k)

        results = []
        for i, idx in enumerate(indices[0]):
            results.append({
                'description': df.iloc[idx]['description'],
                'zip_code': df.iloc[idx]['zip_code'],
                'cluster_name': df.iloc[idx]['cluster_name'],
                'similarity': float(distances[0][i])
            })
    else:
        # Fallback: numpy cosine similarity
        from sklearn.metrics.pairwise import cosine_similarity
        similarities = cosine_similarity(query_embedding, embeddings)[0]

        # Get top-k
        top_indices = np.argsort(similarities)[-top_k:][::-1]

        results = []
        for idx in top_indices:
            results.append({
                'description': df.iloc[idx]['description'],
                'zip_code': df.iloc[idx]['zip_code'],
                'cluster_name': df.iloc[idx]['cluster_name'],
                'similarity': float(similarities[idx])
            })

    return results


def save_index(embeddings, index, df, model_name, output_dir='frontend/public/data'):
    """Save embeddings and metadata"""
    print(f"\n💾 Saving index to {output_dir}...")

    os.makedirs(output_dir, exist_ok=True)

    # Save embeddings as numpy array
    embeddings_path = os.path.join(output_dir, 'embeddings.npy')
    np.save(embeddings_path, embeddings)
    print(f"✅ Saved embeddings: {embeddings_path} ({embeddings.nbytes / 1024 / 1024:.1f} MB)")

    # Save FAISS index if available
    if HAVE_FAISS and index is not None:
        index_path = os.path.join(output_dir, 'faiss.index')
        faiss.write_index(index, index_path)
        print(f"✅ Saved FAISS index: {index_path}")

    # Save metadata (permit info)
    metadata = df[['description', 'zip_code', 'cluster_name']].to_dict('records')
    metadata_path = os.path.join(output_dir, 'search_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump({
            'model_name': model_name,
            'num_permits': len(df),
            'embedding_dim': embeddings.shape[1],
            'metadata': metadata[:1000]  # Save first 1000 for demo (full data in npy)
        }, f)
    print(f"✅ Saved metadata: {metadata_path}")


def demo_search(model, index, df, embeddings):
    """Demo semantic search"""
    print("\n" + "=" * 80)
    print(" SEMANTIC SEARCH DEMO ".center(80, "="))
    print("=" * 80)

    queries = [
        "solar panel installation with battery backup",
        "electric vehicle charging station",
        "backyard cottage accessory dwelling unit",
        "whole home standby generator for power outage",
        "HVAC air conditioning replacement"
    ]

    for query in queries:
        print(f"\n🔍 Query: \"{query}\"")
        print("─" * 80)

        results = search_similar(query, model, index, df, embeddings, top_k=3)

        for i, result in enumerate(results, 1):
            print(f"\n{i}. Similarity: {result['similarity']:.3f}")
            print(f"   Description: {result['description'][:100]}...")
            print(f"   ZIP: {result['zip_code']}, Cluster: {result['cluster_name']}")


def main():
    """Main pipeline"""
    print("=" * 80)
    print(" SEMANTIC SEARCH INDEX BUILDER ".center(80, "="))
    print("=" * 80)

    if not HAVE_EMBEDDINGS:
        print("\n❌ Cannot proceed without sentence-transformers")
        print("\nInstall with:")
        print("  pip install sentence-transformers")
        return

    # Load data
    df = load_permit_data(sample_size=10000)  # Start with 10K for speed

    # Create embeddings
    model_name = 'all-MiniLM-L6-v2'  # 384-dim, 80MB model
    embeddings = create_embeddings(df, model_name)

    if embeddings is None:
        return

    # Build FAISS index
    index = build_faiss_index(embeddings)

    # Load model for search
    model = SentenceTransformer(model_name)

    # Demo search
    demo_search(model, index, df, embeddings)

    # Save index
    save_index(embeddings, index, df, model_name)

    print("\n" + "=" * 80)
    print(" ✅ SEMANTIC SEARCH INDEX COMPLETE! ".center(80, "="))
    print("=" * 80)

    print("\n📚 Next Steps:")
    print("   1. Increase sample_size to 100K+ for production")
    print("   2. Create API endpoint: /api/search?q=solar+panels")
    print("   3. Add search UI to frontend dashboard")
    print("   4. Consider larger model for better accuracy (e.g., all-mpnet-base-v2)")


if __name__ == "__main__":
    main()
