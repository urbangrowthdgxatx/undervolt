#!/usr/bin/env python3
"""
Automatically generate descriptive names for permit clusters

Analyzes cluster characteristics and assigns human-readable names
based on dominant keywords and patterns.
"""

import pandas as pd
import json


def analyze_cluster_characteristics(df, cluster_id):
    """Analyze a single cluster's characteristics"""
    cluster_data = df[df['f_cluster'] == cluster_id]

    # Get keyword columns
    keyword_cols = [c for c in df.columns if '_kw_' in c and c.startswith('f_description_')]

    # Calculate keyword prevalence
    keyword_scores = {}
    for col in keyword_cols:
        keyword = col.replace('f_description_kw_', '')
        score = (cluster_data[col].sum() / len(cluster_data)) * 100
        if score > 0:
            keyword_scores[keyword] = score

    # Sort by prevalence
    top_keywords = sorted(keyword_scores.items(), key=lambda x: x[1], reverse=True)[:3]

    return {
        'size': len(cluster_data),
        'percentage': (len(cluster_data) / len(df)) * 100,
        'top_keywords': top_keywords,
        'keyword_scores': keyword_scores
    }


def generate_cluster_name(characteristics):
    """Generate a descriptive name based on cluster characteristics"""
    top_keywords = [kw for kw, score in characteristics['top_keywords']]
    scores = {kw: score for kw, score in characteristics['top_keywords']}

    # Rule-based naming logic
    if 'demolition' in top_keywords and scores.get('demolition', 0) > 35:
        return "Demolition Projects"

    if 'foundation' in top_keywords and scores.get('foundation', 0) > 80:
        if 'repair' in top_keywords:
            return "Foundation Repairs"
        return "Foundation Work"

    if 'window' in top_keywords and scores.get('window', 0) > 50:
        return "Window Installations & Multi-Trade Remodels"

    if 'remodel' in top_keywords and scores.get('remodel', 0) > 40:
        if 'commercial' in top_keywords:
            return "Commercial Renovations"
        return "Major Residential Remodels"

    if 'new' in top_keywords and scores.get('new', 0) > 80:
        if 'residential' in top_keywords or 'single-family' in top_keywords:
            return "New Residential Construction"
        return "New Construction"

    if 'hvac' in top_keywords and scores.get('hvac', 0) > 5:
        return "HVAC Installations"

    if 'electrical' in top_keywords and scores.get('electrical', 0) > 7:
        if 'roof' in top_keywords:
            return "Electrical & Roofing Work"
        return "Electrical Installations"

    if 'new' in top_keywords and scores.get('new', 0) > 20:
        if 'plumbing' in top_keywords:
            return "General Construction & Plumbing"
        if 'repair' in top_keywords:
            return "General Construction & Repairs"
        return "General New Construction"

    # Fallback to top keyword
    return f"{top_keywords[0].title()} Work" if top_keywords else "Miscellaneous"


def create_cluster_mapping(df):
    """Create a complete mapping of cluster IDs to names"""
    mapping = {}

    for cluster_id in sorted(df['f_cluster'].unique()):
        characteristics = analyze_cluster_characteristics(df, cluster_id)
        name = generate_cluster_name(characteristics)

        mapping[int(cluster_id)] = {
            'name': name,
            'size': characteristics['size'],
            'percentage': round(characteristics['percentage'], 1),
            'top_keywords': [
                {'keyword': kw, 'prevalence': round(score, 1)}
                for kw, score in characteristics['top_keywords']
            ]
        }

    return mapping


def apply_cluster_names(df, mapping):
    """Add a cluster_name column to the DataFrame"""
    df = df.copy()
    df['cluster_name'] = df['f_cluster'].map(
        lambda x: mapping[int(x)]['name'] if x in mapping else f"Cluster {x}"
    )
    return df


def print_cluster_summary(mapping):
    """Print a human-readable summary"""
    print("=" * 80)
    print(" CLUSTER NAMING SUMMARY ".center(80, "="))
    print("=" * 80)

    for cluster_id in sorted(mapping.keys()):
        info = mapping[cluster_id]
        print(f"\n{'─' * 80}")
        print(f"CLUSTER {cluster_id}: {info['name']}")
        print(f"{'─' * 80}")
        print(f"Size: {info['size']:,} permits ({info['percentage']}%)")
        print(f"\nTop Keywords:")
        for kw_info in info['top_keywords']:
            print(f"  - {kw_info['keyword']:20s}: {kw_info['prevalence']:5.1f}%")

    print("\n" + "=" * 80)


def save_mapping(mapping, output_path='output/cluster_names.json'):
    """Save the cluster name mapping to JSON"""
    with open(output_path, 'w') as f:
        json.dump(mapping, f, indent=2)
    print(f"\n✅ Saved cluster mapping to: {output_path}")


def main():
    """Main pipeline for cluster naming"""
    import os

    print("=" * 80)
    print(" CLUSTER NAMING PIPELINE ".center(80, "="))
    print("=" * 80)

    # Load clustered data
    data_path = 'output/permit_summary_by_zip.csv'
    if not os.path.exists(data_path):
        data_path = 'output/permit_data_enriched.csv'

    if not os.path.exists(data_path):
        print(f"❌ Error: No clustered data found!")
        print(f"Expected: output/permit_summary_by_zip.csv or output/permit_data_enriched.csv")
        return

    print(f"\nLoading data from {data_path}...")
    df = pd.read_csv(data_path, low_memory=False)  # Load ALL data, not just 100K

    if 'f_cluster' not in df.columns:
        print("❌ Error: No 'f_cluster' column found!")
        return

    print(f"Loaded {len(df):,} permits with {df['f_cluster'].nunique()} clusters")

    # Generate cluster names
    print("\n🏷️  Generating cluster names...")
    mapping = create_cluster_mapping(df)

    # Print summary
    print_cluster_summary(mapping)

    # Save mapping
    os.makedirs('output', exist_ok=True)
    save_mapping(mapping, 'output/cluster_names.json')

    # Create named version of dataset
    print("\n📊 Adding cluster names to dataset...")
    df_named = apply_cluster_names(df, mapping)

    # Save sample with names
    output_path = 'output/permit_data_named_clusters.csv'
    df_named.to_csv(output_path, index=False)
    print(f"✅ Saved: {output_path}")

    # Print quick reference
    print("\n" + "=" * 80)
    print(" QUICK REFERENCE ".center(80, "="))
    print("=" * 80)
    for cluster_id in sorted(mapping.keys()):
        name = mapping[cluster_id]['name']
        size = mapping[cluster_id]['size']
        pct = mapping[cluster_id]['percentage']
        print(f"  {cluster_id}: {name:50s} ({size:>6,} permits, {pct:>5.1f}%)")
    print("=" * 80)


if __name__ == "__main__":
    main()
