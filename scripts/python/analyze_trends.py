#!/usr/bin/env python3
"""
Time series analysis of permit trends

Analyzes construction permit trends over time by cluster,
identifying growth patterns and emerging signals.
"""

import pandas as pd
import json
import os
from datetime import datetime


def load_permit_data(path='data/Issued_Construction_Permits_20251212.csv', sample_size=500000):
    """Load raw permit data with dates"""
    print(f"Loading {sample_size:,} permits from {path}...")
    df = pd.read_csv(path, nrows=sample_size, low_memory=False)
    print(f"Loaded {len(df):,} permits")
    return df


def parse_dates(df):
    """Parse issue date column"""
    print("\n📅 Parsing dates...")

    # Try different date column names
    date_cols = ['issued_date', 'issue_date', 'applied_date', 'date_issued', 'Issue Date']
    date_col = None

    for col in date_cols:
        if col in df.columns:
            date_col = col
            print(f"   Using date column: {date_col}")
            break

    if not date_col:
        print(f"⚠️  No date column found. Available columns: {df.columns.tolist()[:10]}")
        return df

    df['issue_date'] = pd.to_datetime(df[date_col], errors='coerce')
    df = df[df['issue_date'].notna()]

    # Filter to last 5 years only for performance
    df = df[df['issue_date'] >= '2020-01-01']

    # Extract year, month, quarter
    df['year'] = df['issue_date'].dt.year
    df['month'] = df['issue_date'].dt.month
    df['quarter'] = df['issue_date'].dt.quarter
    df['year_month'] = df['issue_date'].dt.to_period('M').astype(str)
    df['year_quarter'] = df['issue_date'].dt.to_period('Q').astype(str)

    print(f"✅ Parsed {len(df):,} permits with valid dates (2020+)")
    print(f"   Date range: {df['issue_date'].min()} to {df['issue_date'].max()}")

    return df


def load_cluster_assignments(path='output/permit_data_named_clusters.csv', sample_size=500000):
    """Load cluster assignments"""
    print(f"\n🏷️  Loading cluster assignments from {path}...")
    df_clustered = pd.read_csv(path, nrows=sample_size, low_memory=False)

    if 'f_cluster' not in df_clustered.columns:
        print("❌ No cluster column found!")
        print(f"Available columns: {df_clustered.columns.tolist()[:10]}")
        return None

    # Get cluster, description, and date columns
    cols_to_keep = ['description', 'f_cluster', 'cluster_name']

    # Add date column if available
    date_cols = ['issued_date', 'issue_date', 'applied_date']
    for date_col in date_cols:
        if date_col in df_clustered.columns:
            cols_to_keep.append(date_col)
            break

    df_clustered = df_clustered[cols_to_keep]
    print(f"✅ Loaded {len(df_clustered):,} clustered permits")

    return df_clustered


def analyze_monthly_trends(df):
    """Analyze trends by month"""
    print("\n📈 Analyzing monthly trends...")

    # Overall monthly volume
    monthly = df.groupby('year_month').size().reset_index(name='total_permits')
    monthly = monthly.sort_values('year_month')

    # Convert to list of dicts
    monthly_data = monthly.to_dict('records')

    print(f"✅ Analyzed {len(monthly_data)} months")

    return monthly_data


def analyze_cluster_trends(df, cluster_names):
    """Analyze trends by cluster over time"""
    print("\n🎯 Analyzing cluster trends...")

    if 'f_cluster' not in df.columns:
        print("⚠️  No cluster data available")
        return []

    # Monthly permits by cluster
    cluster_monthly = df.groupby(['year_month', 'f_cluster']).size().reset_index(name='permits')

    # Pivot to wide format
    cluster_pivot = cluster_monthly.pivot(index='year_month', columns='f_cluster', values='permits').fillna(0)

    # Add cluster names
    cluster_data = []
    for month in cluster_pivot.index:
        month_data = {'year_month': month}

        for cluster_id in cluster_pivot.columns:
            cluster_name = cluster_names.get(str(int(cluster_id)), {}).get('name', f'Cluster {int(cluster_id)}')
            month_data[cluster_name] = int(cluster_pivot.loc[month, cluster_id])

        cluster_data.append(month_data)

    print(f"✅ Analyzed {len(cluster_data)} months across {len(cluster_pivot.columns)} clusters")

    return cluster_data


def analyze_growth_rates(df):
    """Calculate growth rates by cluster"""
    print("\n📊 Calculating growth rates...")

    if 'f_cluster' not in df.columns or 'year' not in df.columns:
        return []

    # Yearly totals by cluster
    yearly = df.groupby(['year', 'f_cluster']).size().reset_index(name='permits')

    growth_data = []
    for cluster_id in yearly['f_cluster'].unique():
        cluster_data = yearly[yearly['f_cluster'] == cluster_id].sort_values('year')

        if len(cluster_data) < 2:
            continue

        # Calculate year-over-year growth
        years = cluster_data['year'].tolist()
        permits = cluster_data['permits'].tolist()

        # Overall growth rate (first year to last year)
        first_year_permits = permits[0]
        last_year_permits = permits[-1]
        years_elapsed = years[-1] - years[0]

        if years_elapsed > 0 and first_year_permits > 0:
            cagr = ((last_year_permits / first_year_permits) ** (1 / years_elapsed) - 1) * 100
        else:
            cagr = 0

        growth_data.append({
            'cluster_id': int(cluster_id),
            'years': years,
            'permits': permits,
            'cagr': round(cagr, 2),  # Compound Annual Growth Rate
            'total_growth': round(((last_year_permits - first_year_permits) / first_year_permits) * 100, 1) if first_year_permits > 0 else 0,
        })

    # Sort by CAGR
    growth_data.sort(key=lambda x: x['cagr'], reverse=True)

    print(f"✅ Calculated growth for {len(growth_data)} clusters")

    return growth_data


def analyze_seasonal_patterns(df):
    """Detect seasonal patterns"""
    print("\n🌡️  Analyzing seasonal patterns...")

    if 'month' not in df.columns:
        return []

    # Average permits by month (across all years)
    monthly_avg = df.groupby('month').size() / df['year'].nunique()

    seasonal_data = [
        {'month': int(m), 'avg_permits': int(monthly_avg[m])}
        for m in range(1, 13)
    ]

    print(f"✅ Analyzed seasonal patterns")

    return seasonal_data


def main():
    """Main pipeline"""
    print("=" * 80)
    print(" TIME SERIES ANALYSIS PIPELINE ".center(80, "="))
    print("=" * 80)

    # Load cluster names
    cluster_names_path = 'output/cluster_names.json'
    if os.path.exists(cluster_names_path):
        with open(cluster_names_path, 'r') as f:
            cluster_names = json.load(f)
    else:
        cluster_names = {}

    # Load clustered data
    df_clustered = load_cluster_assignments()

    if df_clustered is None:
        print("\n❌ Cannot proceed without cluster data")
        return

    # Parse dates directly from clustered data
    df = parse_dates(df_clustered)

    # Analyze trends
    monthly_trends = analyze_monthly_trends(df)
    cluster_trends = analyze_cluster_trends(df, cluster_names)
    growth_rates = analyze_growth_rates(df)
    seasonal_patterns = analyze_seasonal_patterns(df)

    # Compile results
    results = {
        'monthly_trends': monthly_trends,
        'cluster_trends': cluster_trends,
        'growth_rates': growth_rates,
        'seasonal_patterns': seasonal_patterns,
        'metadata': {
            'total_permits': len(df),
            'date_range': {
                'start': df['issue_date'].min().strftime('%Y-%m-%d') if 'issue_date' in df.columns else None,
                'end': df['issue_date'].max().strftime('%Y-%m-%d') if 'issue_date' in df.columns else None,
            },
            'clusters_analyzed': len(cluster_names),
        }
    }

    # Save results
    output_dir = 'frontend/public/data'
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, 'trends.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Saved: {output_path}")
    print(f"   - {len(monthly_trends)} months analyzed")
    print(f"   - {len(growth_rates)} clusters with growth data")

    # Print top growing clusters
    if growth_rates:
        print("\n🚀 Fastest Growing Clusters (by CAGR):")
        for i, cluster in enumerate(growth_rates[:5], 1):
            cluster_name = cluster_names.get(str(cluster['cluster_id']), {}).get('name', f"Cluster {cluster['cluster_id']}")
            print(f"   {i}. {cluster_name}: {cluster['cagr']:+.1f}% CAGR")

    print("\n" + "=" * 80)
    print(" ✅ TIME SERIES ANALYSIS COMPLETE! ".center(80, "="))
    print("=" * 80)


if __name__ == "__main__":
    main()
