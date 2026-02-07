#!/usr/bin/env python3
"""
Energy Infrastructure Tracker

Extracts and analyzes energy-related permits:
- Solar installations (kW capacity)
- EV chargers
- Battery storage
- Generators
- Panel upgrades

Creates a focused dataset for energy transition analysis.
"""

import pandas as pd
import json
import os
import re
from collections import defaultdict


def load_permit_data(path='output/permit_data_named_clusters.csv', sample_size=None):
    """Load permit data"""
    if sample_size:
        print(f"Loading {sample_size:,} permits from {path}...")
        df = pd.read_csv(path, nrows=sample_size, low_memory=False)
    else:
        print(f"Loading ALL permits from {path}...")
        df = pd.read_csv(path, low_memory=False)
    print(f"Loaded {len(df):,} permits")
    return df


def extract_solar_capacity(description):
    """Extract solar capacity in kW from description"""
    if pd.isna(description):
        return None

    desc_lower = description.lower()

    # Patterns for solar capacity
    patterns = [
        r'(\d+\.?\d*)\s*kw',  # "10.5 kW", "10kW"
        r'(\d+\.?\d*)\s*kilowatt',
        r'(\d+,\d+)\s*watt',  # "10,500 watt"
    ]

    for pattern in patterns:
        match = re.search(pattern, desc_lower)
        if match:
            value_str = match.group(1).replace(',', '')
            try:
                kw = float(value_str)
                # Convert watts to kW if necessary
                if 'watt' in pattern and 'kilowatt' not in pattern:
                    kw = kw / 1000
                # Sanity check: residential solar typically 3-30 kW
                if 0.5 <= kw <= 100:
                    return round(kw, 2)
            except:
                pass

    return None


def classify_energy_permit(row):
    """Classify permit as energy-related and extract details"""
    desc = str(row.get('description', '')).lower()
    work_class = str(row.get('work_class', '')).lower()

    result = {
        'is_energy': False,
        'type': None,
        'capacity_kw': None,
        'signals': []
    }

    # Solar
    if any(kw in desc for kw in ['solar', 'photovoltaic', 'pv system', 'solar panel']):
        result['is_energy'] = True
        result['type'] = 'solar'
        result['signals'].append('solar')
        result['capacity_kw'] = extract_solar_capacity(desc)

    # Battery storage
    if any(kw in desc for kw in ['battery', 'powerwall', 'energy storage', 'ess']):
        result['is_energy'] = True
        if result['type'] is None:
            result['type'] = 'battery'
        result['signals'].append('battery')

    # EV Charger
    if any(kw in desc for kw in ['ev charger', 'electric vehicle', 'ev charging', 'tesla charger', 'wall connector']):
        result['is_energy'] = True
        if result['type'] is None:
            result['type'] = 'ev_charger'
        result['signals'].append('ev_charger')

    # Generator
    if any(kw in desc for kw in ['generator', 'standby gen', 'backup gen', 'generac', 'kohler gen']):
        result['is_energy'] = True
        if result['type'] is None:
            result['type'] = 'generator'
        result['signals'].append('generator')

    # Panel upgrade (electrical infrastructure)
    if any(kw in desc for kw in ['panel upgrade', 'service upgrade', 'electrical panel', '200a panel', '200 amp']):
        result['is_energy'] = True
        if result['type'] is None:
            result['type'] = 'panel_upgrade'
        result['signals'].append('panel_upgrade')

    # HVAC (energy efficiency)
    if any(kw in desc for kw in ['hvac', 'heat pump', 'air condition', 'ac unit']):
        result['is_energy'] = True
        if result['type'] is None:
            result['type'] = 'hvac'
        result['signals'].append('hvac')

    return result


def analyze_energy_permits(df):
    """Extract and analyze energy permits"""
    print("\n⚡ Analyzing energy infrastructure...")

    # Classify each permit
    energy_data = []
    for idx, row in df.iterrows():
        classification = classify_energy_permit(row)

        if classification['is_energy']:
            energy_data.append({
                'permit_number': row.get('permit_num', ''),
                'description': row.get('description', ''),
                'address': row.get('original_address_1', ''),
                'zip_code': row.get('zip_code', ''),
                'latitude': row.get('latitude', ''),
                'longitude': row.get('longitude', ''),
                'cluster_id': row.get('f_cluster', 0),
                'cluster_name': row.get('cluster_name', ''),
                'issued_date': row.get('issued_date', ''),
                'type': classification['type'],
                'capacity_kw': classification['capacity_kw'],
                'signals': ','.join(classification['signals']),
            })

        if (idx + 1) % 10000 == 0:
            print(f"   Processed {idx + 1:,} permits...")

    df_energy = pd.DataFrame(energy_data)

    print(f"\n✅ Found {len(df_energy):,} energy-related permits ({len(df_energy)/len(df)*100:.1f}% of total)")

    return df_energy


def aggregate_by_type(df_energy):
    """Aggregate energy permits by type"""
    print("\n📊 Aggregating by type...")

    type_counts = df_energy['type'].value_counts().to_dict()

    # Calculate average solar capacity
    solar_permits = df_energy[df_energy['type'] == 'solar']
    solar_with_capacity = solar_permits[solar_permits['capacity_kw'].notna()]

    if len(solar_with_capacity) > 0:
        avg_solar_kw = solar_with_capacity['capacity_kw'].mean()
        total_solar_kw = solar_with_capacity['capacity_kw'].sum()
    else:
        avg_solar_kw = 0
        total_solar_kw = 0

    stats = {
        'by_type': type_counts,
        'solar_stats': {
            'total_permits': int(type_counts.get('solar', 0)),
            'with_capacity_data': len(solar_with_capacity),
            'avg_capacity_kw': round(avg_solar_kw, 2),
            'total_capacity_kw': round(total_solar_kw, 2),
        }
    }

    print(f"   Solar: {type_counts.get('solar', 0):,} permits, avg {avg_solar_kw:.1f} kW")
    print(f"   EV Chargers: {type_counts.get('ev_charger', 0):,}")
    print(f"   Batteries: {type_counts.get('battery', 0):,}")
    print(f"   Generators: {type_counts.get('generator', 0):,}")

    return stats


def aggregate_by_zip(df_energy):
    """Aggregate energy permits by ZIP code"""
    print("\n🗺️  Aggregating by ZIP code...")

    zip_stats = []
    for zip_code in df_energy['zip_code'].unique():
        if pd.isna(zip_code):
            continue

        zip_data = df_energy[df_energy['zip_code'] == zip_code]

        # Count by type
        type_counts = zip_data['type'].value_counts().to_dict()

        # Solar capacity for this ZIP
        solar_data = zip_data[zip_data['type'] == 'solar']
        solar_with_capacity = solar_data[solar_data['capacity_kw'].notna()]

        zip_stats.append({
            'zip_code': str(zip_code)[:5],
            'total_energy_permits': len(zip_data),
            'solar': type_counts.get('solar', 0),
            'ev_charger': type_counts.get('ev_charger', 0),
            'battery': type_counts.get('battery', 0),
            'generator': type_counts.get('generator', 0),
            'panel_upgrade': type_counts.get('panel_upgrade', 0),
            'hvac': type_counts.get('hvac', 0),
            'avg_solar_kw': round(solar_with_capacity['capacity_kw'].mean(), 2) if len(solar_with_capacity) > 0 else 0,
        })

    # Sort by total energy permits
    zip_stats.sort(key=lambda x: x['total_energy_permits'], reverse=True)

    print(f"✅ Analyzed {len(zip_stats)} ZIP codes")

    return zip_stats


def analyze_temporal_trends(df_energy):
    """Analyze energy permit trends over time"""
    print("\n📈 Analyzing temporal trends...")

    df_energy['issued_date'] = pd.to_datetime(df_energy['issued_date'], errors='coerce')
    df_energy = df_energy[df_energy['issued_date'].notna()]
    df_energy['year_month'] = df_energy['issued_date'].dt.to_period('M').astype(str)

    # Monthly totals by type
    monthly_by_type = df_energy.groupby(['year_month', 'type']).size().reset_index(name='count')

    # Pivot to wide format
    monthly_pivot = monthly_by_type.pivot(index='year_month', columns='type', values='count').fillna(0)

    # Convert to list of dicts
    monthly_trends = []
    for month in monthly_pivot.index:
        month_data = {'year_month': month}
        for energy_type in monthly_pivot.columns:
            month_data[energy_type] = int(monthly_pivot.loc[month, energy_type])
        monthly_trends.append(month_data)

    print(f"✅ Analyzed {len(monthly_trends)} months")

    return monthly_trends


def main():
    """Main pipeline"""
    print("=" * 80)
    print(" ENERGY INFRASTRUCTURE TRACKER ".center(80, "="))
    print("=" * 80)

    # Load data
    df = load_permit_data()

    # Extract energy permits
    df_energy = analyze_energy_permits(df)

    # Aggregate statistics
    type_stats = aggregate_by_type(df_energy)
    zip_stats = aggregate_by_zip(df_energy)
    monthly_trends = analyze_temporal_trends(df_energy)

    # Compile results
    results = {
        'summary': type_stats,
        'by_zip': zip_stats[:100],  # Top 100 ZIPs
        'monthly_trends': monthly_trends,
        'metadata': {
            'total_permits_analyzed': len(df),
            'total_energy_permits': len(df_energy),
            'energy_percentage': round((len(df_energy) / len(df)) * 100, 2),
        }
    }

    # Save results
    output_dir = 'frontend/public/data'
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, 'energy_infrastructure.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\n✅ Saved: {output_path}")
    print(f"   - {len(df_energy):,} energy permits")
    print(f"   - {len(zip_stats)} ZIP codes")
    print(f"   - {len(monthly_trends)} months of trends")

    # Save detailed permit list
    csv_path = os.path.join('output', 'energy_permits.csv')
    df_energy.to_csv(csv_path, index=False)
    print(f"\n✅ Saved detailed data: {csv_path}")

    # Print top energy ZIPs
    print("\n🏆 Top Energy ZIP Codes:")
    for i, zip_stat in enumerate(zip_stats[:5], 1):
        print(f"   {i}. {zip_stat['zip_code']}: {zip_stat['total_energy_permits']} permits")
        print(f"      Solar: {zip_stat['solar']}, EV: {zip_stat['ev_charger']}, Battery: {zip_stat['battery']}")

    print("\n" + "=" * 80)
    print(" ✅ ENERGY INFRASTRUCTURE TRACKING COMPLETE! ".center(80, "="))
    print("=" * 80)


if __name__ == "__main__":
    main()
