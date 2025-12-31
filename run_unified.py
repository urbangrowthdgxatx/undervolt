#!/usr/bin/env python3
"""
Undervolt Unified Pipeline

Single entry point for all platforms (Jetson, DGX, Mac, Linux).
Auto-detects platform and uses GPU acceleration when available.

Usage:
    python run_unified.py                    # Full pipeline on all data
    python run_unified.py --sample 100000    # Test with sample
    python run_unified.py --help             # Show all options
"""

import os
import sys
import time
import logging
import argparse
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from pipeline.platform import get_config, print_platform_info
from pipeline.data_unified import load_data, clean_data
from pipeline.nlp.enrichment import nlp_enrich
from pipeline.clustering_unified import cluster_data

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger(__name__)


def banner(text: str, char: str = '='):
    """Print centered banner"""
    width = 80
    print('\n' + char * width)
    print(f' {text} '.center(width, char))
    print(char * width + '\n')


def step_1_load(data_path, sample_size=None):
    """Load raw permit data"""
    banner("STEP 1: LOAD DATA")

    df = load_data(data_path)

    if sample_size and len(df) > sample_size:
        log.info(f"Sampling to {sample_size:,} permits...")
        df = df.head(sample_size)

    return df


def step_2_clean(df):
    """Clean and normalize data"""
    banner("STEP 2: CLEAN DATA")
    return clean_data(df)


def step_3_nlp(df):
    """NLP keyword extraction"""
    banner("STEP 3: NLP ENRICHMENT")

    text_columns = [
        "description", "work_class", "permit_class",
        "permit_type_desc", "permit_type"
    ]

    log.info(f"Extracting keywords from {len(text_columns)} text columns...")
    df = nlp_enrich(df, text_columns)

    # Count features
    feature_cols = [c for c in df.columns if c.startswith('f_')]
    log.info(f"✅ Added {len(feature_cols)} feature columns")

    return df


def step_4_cluster(df):
    """KMeans clustering"""
    banner("STEP 4: CLUSTERING")
    return cluster_data(df, n_clusters=8)


def step_5_extract_energy(df):
    """Extract energy permits"""
    banner("STEP 5: EXTRACT ENERGY PERMITS")

    # Import energy classification
    sys.path.insert(0, str(Path(__file__).parent / 'scripts' / 'python'))
    from track_energy_infrastructure import classify_energy_permit

    log.info(f"Analyzing {len(df):,} permits for energy signals...")

    energy_permits = []
    batch_size = 10000

    for idx, row in df.iterrows():
        classification = classify_energy_permit(row)

        if classification['is_energy']:
            energy_permits.append({
                'permit_number': row.get('permit_num', ''),
                'description': row.get('description', ''),
                'address': row.get('original_address_1', ''),
                'zip_code': row.get('zip_code', ''),
                'latitude': row.get('latitude', ''),
                'longitude': row.get('longitude', ''),
                'cluster_id': row.get('f_cluster', 0),
                'issued_date': row.get('issued_date', ''),
                'type': classification['type'],
                'capacity_kw': classification['capacity_kw'],
                'signals': ','.join(classification['signals']),
            })

        if (idx + 1) % batch_size == 0:
            log.info(f"  Processed {idx + 1:,} / {len(df):,} ({len(energy_permits):,} energy found)")

    import pandas as pd
    df_energy = pd.DataFrame(energy_permits)

    pct = (len(df_energy) / len(df)) * 100
    log.info(f"✅ Found {len(df_energy):,} energy permits ({pct:.1f}%)")

    # Show type distribution
    type_counts = df_energy['type'].value_counts()
    log.info("Energy type distribution:")
    for energy_type, count in type_counts.items():
        log.info(f"  {energy_type}: {count:,}")

    return df_energy


def step_6_save(df_all, df_energy):
    """Save outputs"""
    banner("STEP 6: SAVE OUTPUTS")

    output_dir = Path('output')
    frontend_dir = Path('frontend/public/data')

    output_dir.mkdir(exist_ok=True)
    frontend_dir.mkdir(parents=True, exist_ok=True)

    # Save enriched dataset
    enriched_path = output_dir / 'permit_data_enriched.csv'
    df_all.to_csv(enriched_path, index=False)
    log.info(f"✅ Saved enriched data: {enriched_path} ({len(df_all):,} permits)")

    # Save energy permits
    energy_path = output_dir / 'energy_permits.csv'
    df_energy.to_csv(energy_path, index=False)
    log.info(f"✅ Saved energy permits: {energy_path} ({len(df_energy):,} permits)")

    # Generate frontend JSON
    import json
    from track_energy_infrastructure import aggregate_by_type, aggregate_by_zip, analyze_temporal_trends

    type_stats = aggregate_by_type(df_energy)
    zip_stats = aggregate_by_zip(df_energy)
    monthly_trends = analyze_temporal_trends(df_energy)

    frontend_json = {
        'summary': type_stats,
        'by_zip': zip_stats[:100],
        'monthly_trends': monthly_trends,
        'metadata': {
            'total_permits_analyzed': len(df_all),
            'total_energy_permits': len(df_energy),
            'energy_percentage': round((len(df_energy) / len(df_all)) * 100, 2),
            'pipeline_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        }
    }

    frontend_path = frontend_dir / 'energy_infrastructure.json'
    with open(frontend_path, 'w') as f:
        json.dump(frontend_json, f, indent=2)

    log.info(f"✅ Saved frontend data: {frontend_path}")

    return {
        'enriched_csv': enriched_path,
        'energy_csv': energy_path,
        'frontend_json': frontend_path,
    }


def main():
    parser = argparse.ArgumentParser(
        description='Undervolt Unified Pipeline - Auto-detects platform and uses GPU when available'
    )
    parser.add_argument(
        '--sample',
        type=int,
        help='Sample size for testing (e.g., 100000)'
    )
    parser.add_argument(
        '--skip-clustering',
        action='store_true',
        help='Skip clustering step'
    )
    parser.add_argument(
        '--data-path',
        type=str,
        default='data/Issued_Construction_Permits_20251212.csv',
        help='Path to raw CSV data'
    )
    args = parser.parse_args()

    banner("UNDERVOLT UNIFIED PIPELINE", char='█')

    # Show platform info
    print_platform_info()

    # Check data file exists
    if not os.path.exists(args.data_path):
        log.error(f"❌ Data file not found: {args.data_path}")
        log.error("Download from: https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu")
        return 1

    start_time = time.time()

    try:
        # Execute pipeline
        df = step_1_load(args.data_path, args.sample)
        df = step_2_clean(df)
        df = step_3_nlp(df)

        if not args.skip_clustering:
            df = step_4_cluster(df)
        else:
            log.info("⏭️  Skipping clustering (--skip-clustering)")

        df_energy = step_5_extract_energy(df)
        outputs = step_6_save(df, df_energy)

        # Print summary
        elapsed = time.time() - start_time
        banner("PIPELINE COMPLETE", char='█')

        config = get_config()
        log.info(f"Platform:        {config.name.upper()}")
        log.info(f"GPU Used:        {'Yes' if config.use_cudf or config.use_cuml else 'No'}")
        log.info(f"⏱️  Total time:     {elapsed:.1f}s ({elapsed/60:.1f} min)")
        log.info(f"📊 Processed:      {len(df):,} total permits")
        log.info(f"⚡ Energy found:   {len(df_energy):,} permits")
        log.info("")
        log.info("Output files:")
        for name, path in outputs.items():
            log.info(f"  - {path}")
        log.info("")
        log.info("Next steps:")
        log.info("  1. Ingest to DB:     npm run db:reset")
        log.info("  2. View database:    npm run db:studio")
        log.info("  3. Start frontend:   cd frontend && bun run dev")

        return 0

    except Exception as e:
        log.error(f"❌ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
