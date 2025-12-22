#!/usr/bin/env python3
"""
Visualize clustering results from the pipeline

Creates various visualizations of the permit clusters including:
- 2D PCA projection
- Cluster characteristics
- Geographic distribution
- Keyword heatmaps
"""

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
import os

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)

def load_clustered_data(path='output/permit_summary_by_zip.csv', nrows=100000):
    """Load the clustered data"""
    print(f"Loading {nrows:,} rows from {path}...")
    df = pd.read_csv(path, nrows=nrows, low_memory=False)
    print(f"Loaded {len(df):,} permits with {len(df.columns)} columns")
    return df


def visualize_2d_clusters(df, output_dir='output/visualizations', cluster_names=None):
    """Create 2D PCA visualization of clusters"""
    print("\n📊 Creating 2D cluster visualization...")

    # Get feature columns
    feature_cols = [c for c in df.columns if c.startswith('f_') and c != 'f_cluster']

    if len(feature_cols) == 0:
        print("No feature columns found!")
        return

    print(f"Using {len(feature_cols)} features for PCA")

    # Prepare data
    X = df[feature_cols].fillna(0).astype('float32')
    clusters = df['f_cluster'].values

    # Apply PCA
    print("Running PCA for 2D projection...")
    pca = PCA(n_components=2)
    X_pca = pca.fit_transform(StandardScaler().fit_transform(X))

    # Create visualization
    fig, ax = plt.subplots(figsize=(14, 10))

    # Plot each cluster
    unique_clusters = sorted(df['f_cluster'].unique())
    colors = plt.cm.tab10(np.linspace(0, 1, len(unique_clusters)))

    for i, cluster_id in enumerate(unique_clusters):
        mask = clusters == cluster_id
        count = mask.sum()

        # Use cluster name if available
        if cluster_names and cluster_id in cluster_names:
            label = f'{cluster_names[cluster_id]["name"]} (n={count:,})'
        else:
            label = f'Cluster {cluster_id} (n={count:,})'

        ax.scatter(
            X_pca[mask, 0],
            X_pca[mask, 1],
            c=[colors[i]],
            label=label,
            alpha=0.6,
            s=10
        )

    ax.set_xlabel(f'PC1 ({pca.explained_variance_ratio_[0]*100:.1f}% variance)', fontsize=12)
    ax.set_ylabel(f'PC2 ({pca.explained_variance_ratio_[1]*100:.1f}% variance)', fontsize=12)
    ax.set_title('Permit Clusters - 2D PCA Projection', fontsize=16, fontweight='bold')
    ax.legend(loc='best', framealpha=0.9)
    ax.grid(True, alpha=0.3)

    # Save
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, 'cluster_2d_projection.png')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Saved: {output_path}")
    plt.close()


def visualize_cluster_characteristics(df, output_dir='output/visualizations', cluster_names=None):
    """Create heatmap of cluster characteristics"""
    print("\n🔥 Creating cluster characteristics heatmap...")

    # Get keyword feature columns
    keyword_cols = [c for c in df.columns if '_kw_' in c and c.startswith('f_description_')]

    if len(keyword_cols) == 0:
        print("No keyword columns found!")
        return

    # Calculate keyword prevalence per cluster
    cluster_keywords = []
    cluster_labels = []
    for cluster_id in sorted(df['f_cluster'].unique()):
        cluster_data = df[df['f_cluster'] == cluster_id]
        keyword_percentages = []
        for col in keyword_cols:
            pct = (cluster_data[col].sum() / len(cluster_data)) * 100
            keyword_percentages.append(pct)
        cluster_keywords.append(keyword_percentages)

        # Use cluster name if available
        if cluster_names and cluster_id in cluster_names:
            cluster_labels.append(cluster_names[cluster_id]["name"])
        else:
            cluster_labels.append(f'Cluster {cluster_id}')

    # Create DataFrame
    keyword_names = [c.replace('f_description_kw_', '') for c in keyword_cols]
    cluster_df = pd.DataFrame(
        cluster_keywords,
        index=cluster_labels,
        columns=keyword_names
    )

    # Create heatmap
    fig, ax = plt.subplots(figsize=(16, 8))
    sns.heatmap(
        cluster_df.T,
        annot=True,
        fmt='.1f',
        cmap='YlOrRd',
        cbar_kws={'label': 'Keyword Prevalence (%)'},
        linewidths=0.5,
        ax=ax
    )
    ax.set_title('Cluster Characteristics - Keyword Prevalence (%)',
                 fontsize=16, fontweight='bold', pad=20)
    ax.set_xlabel('Cluster ID', fontsize=12)
    ax.set_ylabel('Keywords', fontsize=12)

    # Save
    output_path = os.path.join(output_dir, 'cluster_characteristics.png')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Saved: {output_path}")
    plt.close()


def visualize_cluster_sizes(df, output_dir='output/visualizations', cluster_names=None):
    """Create cluster size distribution"""
    print("\n📊 Creating cluster size distribution...")

    cluster_counts = df['f_cluster'].value_counts().sort_index()

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 6))

    # Bar chart
    colors = plt.cm.tab10(np.linspace(0, 1, len(cluster_counts)))

    # Create labels
    if cluster_names:
        labels = [cluster_names.get(i, {}).get("name", f'Cluster {i}') for i in cluster_counts.index]
    else:
        labels = [f'Cluster {i}' for i in cluster_counts.index]

    bars = ax1.bar(range(len(cluster_counts)), cluster_counts.values, color=colors, alpha=0.8)
    ax1.set_xticks(range(len(cluster_counts)))
    ax1.set_xticklabels(labels, rotation=45, ha='right', fontsize=9)
    ax1.set_ylabel('Number of Permits', fontsize=12)
    ax1.set_title('Cluster Size Distribution', fontsize=14, fontweight='bold')
    ax1.grid(axis='y', alpha=0.3)

    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'{int(height):,}',
                ha='center', va='bottom', fontsize=10)

    # Pie chart
    ax2.pie(cluster_counts.values,
           labels=labels,
           autopct='%1.1f%%',
           colors=colors,
           startangle=90)
    ax2.set_title('Cluster Distribution (%)', fontsize=14, fontweight='bold')

    # Save
    output_path = os.path.join(output_dir, 'cluster_sizes.png')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Saved: {output_path}")
    plt.close()


def visualize_geographic_clusters(df, output_dir='output/visualizations'):
    """Visualize cluster distribution by ZIP code"""
    print("\n🗺️  Creating geographic cluster distribution...")

    # Get top 15 ZIP codes
    top_zips = df['zip_code'].value_counts().head(15).index
    df_top = df[df['zip_code'].isin(top_zips)]

    # Create cross-tabulation
    cluster_by_zip = pd.crosstab(
        df_top['zip_code'],
        df_top['f_cluster'],
        normalize='index'
    ) * 100

    # Sort by total permits
    zip_counts = df_top['zip_code'].value_counts()
    cluster_by_zip = cluster_by_zip.loc[zip_counts.index[:15]]

    # Create stacked bar chart
    fig, ax = plt.subplots(figsize=(14, 8))
    colors = plt.cm.tab10(np.linspace(0, 1, len(cluster_by_zip.columns)))
    cluster_by_zip.plot(
        kind='barh',
        stacked=True,
        ax=ax,
        color=colors,
        alpha=0.8
    )

    ax.set_xlabel('Percentage of Permits (%)', fontsize=12)
    ax.set_ylabel('ZIP Code', fontsize=12)
    ax.set_title('Cluster Distribution by Top 15 ZIP Codes', fontsize=14, fontweight='bold')
    ax.legend(title='Cluster', bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.grid(axis='x', alpha=0.3)

    # Save
    output_path = os.path.join(output_dir, 'geographic_clusters.png')
    plt.tight_layout()
    plt.savefig(output_path, dpi=300, bbox_inches='tight')
    print(f"✅ Saved: {output_path}")
    plt.close()


def create_cluster_summary_report(df, output_dir='output/visualizations'):
    """Create text summary of cluster characteristics"""
    print("\n📝 Creating cluster summary report...")

    report = []
    report.append("=" * 80)
    report.append(" CLUSTER ANALYSIS SUMMARY ".center(80, "="))
    report.append("=" * 80)
    report.append(f"\nTotal Permits Analyzed: {len(df):,}")
    report.append(f"Number of Clusters: {df['f_cluster'].nunique()}")
    report.append(f"Total Features: {len([c for c in df.columns if c.startswith('f_')])}")

    # Get keyword columns
    keyword_cols = [c for c in df.columns if '_kw_' in c and c.startswith('f_description_')]

    for cluster_id in sorted(df['f_cluster'].unique()):
        cluster_data = df[df['f_cluster'] == cluster_id]

        report.append(f"\n{'─' * 80}")
        report.append(f"CLUSTER {cluster_id}")
        report.append(f"{'─' * 80}")
        report.append(f"Size: {len(cluster_data):,} permits ({len(cluster_data)/len(df)*100:.1f}%)")

        # Top keywords
        report.append("\nTop Keywords:")
        keyword_scores = {}
        for col in keyword_cols:
            keyword = col.replace('f_description_kw_', '')
            score = (cluster_data[col].sum() / len(cluster_data)) * 100
            if score > 0:
                keyword_scores[keyword] = score

        for keyword, score in sorted(keyword_scores.items(), key=lambda x: x[1], reverse=True)[:5]:
            report.append(f"  - {keyword:20s}: {score:5.1f}%")

        # Top ZIP codes
        top_zips = cluster_data['zip_code'].value_counts().head(3)
        report.append("\nTop ZIP Codes:")
        for zip_code, count in top_zips.items():
            report.append(f"  - {str(zip_code)[:5]:>5s}: {count:>6,} permits")

    report.append("\n" + "=" * 80)

    # Save report
    output_path = os.path.join(output_dir, 'cluster_summary.txt')
    with open(output_path, 'w') as f:
        f.write('\n'.join(report))

    print(f"✅ Saved: {output_path}")

    # Also print to console
    print('\n'.join(report))


def main():
    """Main visualization pipeline"""
    print("=" * 80)
    print(" CLUSTER VISUALIZATION PIPELINE ".center(80, "="))
    print("=" * 80)

    # Load data
    df = load_clustered_data()

    # Check if cluster column exists
    if 'f_cluster' not in df.columns:
        print("❌ Error: No 'f_cluster' column found!")
        print("Make sure you've run the clustering pipeline first.")
        return

    # Create output directory
    output_dir = 'output/visualizations'
    os.makedirs(output_dir, exist_ok=True)

    # Load cluster names if available
    cluster_names = None
    names_path = 'output/cluster_names.json'
    if os.path.exists(names_path):
        print(f"\n📖 Loading cluster names from {names_path}...")
        import json
        with open(names_path, 'r') as f:
            cluster_names = {int(k): v for k, v in json.load(f).items()}
        print(f"✅ Loaded names for {len(cluster_names)} clusters")
    else:
        print(f"\n⚠️  No cluster names found at {names_path}")
        print("   Visualizations will use generic 'Cluster N' labels")
        print("   Run 'python scripts/name_clusters.py' to generate names")

    # Generate visualizations
    visualize_cluster_sizes(df, output_dir, cluster_names)
    visualize_2d_clusters(df, output_dir, cluster_names)
    visualize_cluster_characteristics(df, output_dir, cluster_names)
    visualize_geographic_clusters(df, output_dir)
    create_cluster_summary_report(df, output_dir)

    print("\n" + "=" * 80)
    print(" ✅ VISUALIZATION COMPLETE! ".center(80, "="))
    print("=" * 80)
    print(f"\nAll visualizations saved to: {output_dir}/")
    print("\nGenerated files:")
    print("  - cluster_2d_projection.png    (PCA 2D scatter)")
    print("  - cluster_sizes.png            (Bar chart + pie)")
    print("  - cluster_characteristics.png  (Keyword heatmap)")
    print("  - geographic_clusters.png      (Stacked bars by ZIP)")
    print("  - cluster_summary.txt          (Text report)")


if __name__ == "__main__":
    main()
