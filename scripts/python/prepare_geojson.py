#!/usr/bin/env python3
"""
Prepare GeoJSON from permit data for frontend map visualization

Converts the clustered permit CSV into GeoJSON format suitable for Mapbox.
Aggregates by ZIP code and cluster for performance.
"""

import pandas as pd
import json
import os
from collections import defaultdict


def load_permit_data(path='output/permit_summary_by_zip.csv', sample_size=50000):
    """Load permit data with clustering"""
    print(f"Loading {sample_size:,} permits from {path}...")
    df = pd.read_csv(path, nrows=sample_size, low_memory=False)
    print(f"Loaded {len(df):,} permits")
    return df


def load_cluster_names(path='output/cluster_names.json'):
    """Load cluster name mapping"""
    with open(path, 'r') as f:
        return json.load(f)


def aggregate_by_zip(df):
    """Aggregate permits by ZIP code"""
    print("\nAggregating by ZIP code...")

    # Get feature columns
    feature_cols = [c for c in df.columns if c.startswith('f_') and c != 'f_cluster']

    agg_data = []
    for zip_code in df['zip_code'].unique():
        if pd.isna(zip_code):
            continue

        zip_data = df[df['zip_code'] == zip_code]

        # Count by cluster
        cluster_counts = zip_data['f_cluster'].value_counts().to_dict()

        # Get dominant cluster
        dominant_cluster = int(zip_data['f_cluster'].mode()[0]) if len(zip_data) > 0 else 0

        # Calculate feature prevalence
        features = {}
        for col in feature_cols:
            if col in zip_data.columns:
                prevalence = (zip_data[col].sum() / len(zip_data)) * 100 if len(zip_data) > 0 else 0
                features[col.replace('f_description_kw_', '')] = round(prevalence, 2)

        agg_data.append({
            'zip_code': str(zip_code)[:5],  # Normalize to 5 digits
            'total_permits': len(zip_data),
            'dominant_cluster': dominant_cluster,
            'cluster_distribution': {int(k): int(v) for k, v in cluster_counts.items()},
            'features': features,
        })

    return agg_data


def create_geojson(zip_aggregates, cluster_names):
    """Create GeoJSON from ZIP aggregates"""
    print("\n🗺️  Creating GeoJSON...")

    # Austin ZIP code centroids (approximate)
    # In production, would use a geocoding service or ZIP centroid database
    zip_coords = {
        '78701': [-97.7431, 30.2672],
        '78702': [-97.7180, 30.2620],
        '78703': [-97.7636, 30.2850],
        '78704': [-97.7620, 30.2420],
        '78705': [-97.7418, 30.2867],
        '78721': [-97.6850, 30.2780],
        '78722': [-97.7142, 30.2885],
        '78723': [-97.6920, 30.3050],
        '78724': [-97.6580, 30.2738],
        '78725': [-97.6349, 30.2441],
        '78726': [-97.8790, 30.4420],
        '78727': [-97.7140, 30.4180],
        '78728': [-97.6880, 30.4420],
        '78729': [-97.7930, 30.4350],
        '78730': [-97.8340, 30.3650],
        '78731': [-97.7580, 30.3550],
        '78732': [-97.8950, 30.3840],
        '78733': [-97.8630, 30.3220],
        '78734': [-97.9450, 30.3830],
        '78735': [-97.8480, 30.2660],
        '78736': [-97.9390, 30.2350],
        '78737': [-97.9720, 30.2950],
        '78738': [-97.9580, 30.3580],
        '78739': [-97.8990, 30.2120],
        '78741': [-97.7280, 30.2320],
        '78742': [-97.6690, 30.2210],
        '78744': [-97.7310, 30.1870],
        '78745': [-97.7850, 30.2080],
        '78746': [-97.8100, 30.2950],
        '78747': [-97.8490, 30.1690],
        '78748': [-97.8200, 30.1750],
        '78749': [-97.8820, 30.2430],
        '78750': [-97.8050, 30.4150],
        '78751': [-97.7250, 30.3110],
        '78752': [-97.7020, 30.3350],
        '78753': [-97.6740, 30.3610],
        '78754': [-97.6650, 30.3370],
        '78756': [-97.7440, 30.3100],
        '78757': [-97.7280, 30.3380],
        '78758': [-97.6920, 30.3780],
        '78759': [-97.7520, 30.3950],
        '78634': [-97.8250, 30.5950],  # Hutto
        '78660': [-97.6670, 30.4330],  # Pflugerville
        '78664': [-97.8350, 30.6150],  # Round Rock
        '78681': [-97.7550, 30.5150],  # Round Rock
        '78610': [-98.0580, 30.1680],  # Buda
        '78617': [-97.8680, 30.0870],  # Del Valle
        '78653': [-98.1950, 30.2880],  # Manor
        '78613': [-97.6480, 30.1350],  # Cedar Creek
    }

    features = []
    for agg in zip_aggregates:
        zip_code = agg['zip_code']

        # Get coordinates (skip if not found)
        if zip_code not in zip_coords:
            continue

        coords = zip_coords[zip_code]
        cluster_id = agg['dominant_cluster']
        cluster_name = cluster_names.get(str(cluster_id), {}).get('name', f'Cluster {cluster_id}')

        feature = {
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': coords  # [lng, lat] for GeoJSON
            },
            'properties': {
                'zip_code': zip_code,
                'total_permits': agg['total_permits'],
                'cluster_id': cluster_id,
                'cluster_name': cluster_name,
                'cluster_distribution': agg['cluster_distribution'],
                'features': agg['features'],
            }
        }
        features.append(feature)

    geojson = {
        'type': 'FeatureCollection',
        'features': features,
        'metadata': {
            'total_zips': len(features),
            'total_permits': sum(f['properties']['total_permits'] for f in features),
            'cluster_names': cluster_names,
        }
    }

    return geojson


def create_cluster_summary(df, cluster_names):
    """Create summary statistics by cluster"""
    print("\n📊 Creating cluster summary...")

    summaries = []
    for cluster_id in sorted(df['f_cluster'].unique()):
        cluster_data = df[df['f_cluster'] == cluster_id]

        # Get keyword features
        keyword_cols = [c for c in df.columns if '_kw_' in c and c.startswith('f_description_')]

        top_keywords = []
        for col in keyword_cols:
            keyword = col.replace('f_description_kw_', '')
            prevalence = (cluster_data[col].sum() / len(cluster_data)) * 100
            if prevalence > 1:  # Only include if >1%
                top_keywords.append({
                    'keyword': keyword,
                    'prevalence': round(prevalence, 1)
                })

        # Sort by prevalence
        top_keywords.sort(key=lambda x: x['prevalence'], reverse=True)

        summaries.append({
            'id': int(cluster_id),
            'name': cluster_names.get(str(cluster_id), {}).get('name', f'Cluster {cluster_id}'),
            'count': len(cluster_data),
            'percentage': round((len(cluster_data) / len(df)) * 100, 1),
            'top_keywords': top_keywords[:5],  # Top 5
        })

    return summaries


def main():
    """Main pipeline"""
    print("=" * 80)
    print(" GeoJSON PREPARATION PIPELINE ".center(80, "="))
    print("=" * 80)

    # Load data
    df = load_permit_data()

    # Load cluster names
    cluster_names = load_cluster_names()

    # Aggregate by ZIP
    zip_aggregates = aggregate_by_zip(df)

    # Create GeoJSON
    geojson = create_geojson(zip_aggregates, cluster_names)

    # Create cluster summary
    cluster_summary = create_cluster_summary(df, cluster_names)

    # Save outputs
    output_dir = 'frontend/public/data'
    os.makedirs(output_dir, exist_ok=True)

    geojson_path = os.path.join(output_dir, 'permits.geojson')
    with open(geojson_path, 'w') as f:
        json.dump(geojson, f)
    print(f"\n✅ Saved: {geojson_path}")
    print(f"   - {len(geojson['features'])} ZIP codes")
    print(f"   - {geojson['metadata']['total_permits']:,} total permits")

    summary_path = os.path.join(output_dir, 'cluster_summary.json')
    with open(summary_path, 'w') as f:
        json.dump(cluster_summary, f, indent=2)
    print(f"\n✅ Saved: {summary_path}")
    print(f"   - {len(cluster_summary)} clusters")

    # Print sample
    print("\n📍 Sample ZIP Code Data:")
    for feature in geojson['features'][:3]:
        props = feature['properties']
        print(f"   {props['zip_code']}: {props['total_permits']:,} permits → {props['cluster_name']}")

    print("\n" + "=" * 80)
    print(" ✅ GEOJSON PREPARATION COMPLETE! ".center(80, "="))
    print("=" * 80)


if __name__ == "__main__":
    main()
