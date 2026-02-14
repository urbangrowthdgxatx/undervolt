#!/usr/bin/env python3
"""
Undervolt End-to-End Data Pipeline

Single unified pipeline that runs all steps in sequence:
1. Load raw Austin permits (2.4M records)
2. Clean data (lat/lng filtering, null handling)
3. NLP enrichment (keyword extraction)
4. Clustering (KMeans with 8 clusters)
5. Energy extraction (filter to energy permits)
6. Save outputs (CSV + JSON for frontend/database)

Usage:
    python run_pipeline.py
    python run_pipeline.py --sample 100000  # Test with smaller sample
"""

import os
import sys
import time
import argparse
import logging
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
log = logging.getLogger('pipeline')


def print_banner(text, char='=', width=80):
    """Print a centered banner"""
    print('\n' + char * width)
    print(f' {text} '.center(width, char))
    print(char * width + '\n')


def check_prerequisites():
    """Check that required files exist"""
    from pipeline.config import DATA_PATH

    if not os.path.exists(DATA_PATH):
        log.error(f"❌ Raw data file not found: {DATA_PATH}")
        log.error("Download from: https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu")
        log.error("Or run: bash scripts/shell/download_data.sh")
        return False

    log.info(f"✅ Found raw data: {DATA_PATH}")
    return True


def detect_platform():
    """Detect platform and configure GPU settings"""
    import platform

    system = platform.system()
    machine = platform.machine()

    if machine.startswith('aarch64'):
        platform_name = 'jetson'
        has_gpu = True
    elif machine == 'arm64' and system == 'Darwin':
        platform_name = 'mac'
        has_gpu = False  # Use CPU on Mac
    elif system == 'Linux':
        # Check for NVIDIA GPU
        try:
            import subprocess
            subprocess.run(['nvidia-smi'], check=True, capture_output=True)
            platform_name = 'dgx'
            has_gpu = True
        except:
            platform_name = 'linux'
            has_gpu = False
    else:
        platform_name = 'unknown'
        has_gpu = False

    log.info(f"🖥️  Platform detected: {platform_name} ({machine}, {system})")
    log.info(f"🎮 GPU acceleration: {'ENABLED (CUDA)' if has_gpu else 'DISABLED (CPU)'}")

    return platform_name, has_gpu


def step_1_load_data(sample_size=None):
    """Step 1: Load raw permit data"""
    from pipeline.data import load_data
    from pipeline.config import DATA_PATH, GPU_ENABLED

    print_banner("STEP 1: LOAD RAW DATA")

    log.info(f"Loading from: {DATA_PATH}")
    log.info(f"Accelerator: {'cuDF (GPU)' if GPU_ENABLED else 'pandas (CPU)'}")

    if sample_size:
        log.info(f"Sample size: {sample_size:,} permits")

    df = load_data(DATA_PATH)

    if sample_size and len(df) > sample_size:
        df = df.head(sample_size)
        log.info(f"Sampled to {len(df):,} permits")

    log.info(f"✅ Loaded {len(df):,} permits")
    return df


def step_2_clean_data(df):
    """Step 2: Clean and normalize data"""
    from pipeline.data import clean_permit_data

    print_banner("STEP 2: CLEAN & NORMALIZE DATA")

    before_count = len(df)
    log.info(f"Input: {before_count:,} permits")

    df_clean = clean_permit_data(df)

    after_count = len(df_clean)
    removed = before_count - after_count
    log.info(f"✅ Output: {after_count:,} permits ({removed:,} removed)")

    return df_clean


def step_3_nlp_enrich(df):
    """Step 3: NLP keyword extraction"""
    from pipeline.nlp import nlp_enrich
    from pipeline.config import TEXT_COLUMNS

    print_banner("STEP 3: NLP ENRICHMENT")

    log.info(f"Extracting keywords from {len(TEXT_COLUMNS)} text columns")
    df_enriched = nlp_enrich(df, TEXT_COLUMNS)

    # Count feature columns
    feature_cols = [c for c in df_enriched.columns if c.startswith('f_')]
    log.info(f"✅ Added {len(feature_cols)} feature columns")

    return df_enriched


def step_4_clustering(df):
    """Step 4: KMeans clustering"""
    from pipeline.clustering import run_cuml_clustering
    from pipeline.config import GPU_ENABLED

    print_banner("STEP 4: CLUSTERING (KMeans)")

    backend = "cuML (GPU)" if GPU_ENABLED else "scikit-learn (CPU)"
    log.info(f"Running KMeans clustering with {backend}...")

    df_clustered = run_cuml_clustering(df)

    # Show cluster distribution
    cluster_counts = df_clustered['f_cluster'].value_counts().sort_index()
    log.info("Cluster distribution:")
    for cluster_id, count in cluster_counts.items():
        pct = (count / len(df_clustered)) * 100
        log.info(f"  Cluster {cluster_id}: {count:,} permits ({pct:.1f}%)")

    log.info(f"✅ Assigned {len(df_clustered):,} permits to clusters")
    return df_clustered


def step_5_extract_energy(df):
    """Step 5: Extract energy-related permits"""
    print_banner("STEP 5: ENERGY PERMIT EXTRACTION")

    # Import energy extraction logic
    sys.path.insert(0, str(Path(__file__).parent / 'scripts' / 'python'))
    from track_energy_infrastructure import classify_energy_permit, extract_solar_capacity

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
                'cluster_name': row.get('cluster_name', ''),
                'issued_date': row.get('issued_date', ''),
                'type': classification['type'],
                'capacity_kw': classification['capacity_kw'],
                'signals': ','.join(classification['signals']),
            })

        if (idx + 1) % batch_size == 0:
            log.info(f"  Processed {idx + 1:,} / {len(df):,} permits ({len(energy_permits):,} energy found)")

    import pandas as pd
    df_energy = pd.DataFrame(energy_permits)

    pct = (len(df_energy) / len(df)) * 100
    log.info(f"✅ Found {len(df_energy):,} energy permits ({pct:.1f}% of total)")

    # Show type distribution
    type_counts = df_energy['type'].value_counts()
    log.info("Energy type distribution:")
    for energy_type, count in type_counts.items():
        log.info(f"  {energy_type}: {count:,}")

    return df_energy


def step_6_save_outputs(df_all, df_energy):
    """Step 6: Save all outputs"""
    print_banner("STEP 6: SAVE OUTPUTS")

    output_dir = Path('output')
    frontend_dir = Path('frontend/public/data')

    output_dir.mkdir(exist_ok=True)
    frontend_dir.mkdir(parents=True, exist_ok=True)

    # Save enriched dataset (all permits with clusters)
    enriched_path = output_dir / 'permit_data_enriched.csv'
    df_all.to_csv(enriched_path, index=False)
    log.info(f"✅ Saved enriched data: {enriched_path} ({len(df_all):,} permits)")

    # Save energy permits
    energy_path = output_dir / 'energy_permits.csv'
    df_energy.to_csv(energy_path, index=False)
    log.info(f"✅ Saved energy permits: {energy_path} ({len(df_energy):,} permits)")

    # Generate aggregations for frontend
    import json
    from track_energy_infrastructure import aggregate_by_type, aggregate_by_zip, analyze_temporal_trends

    sys.path.insert(0, str(Path(__file__).parent / 'scripts' / 'python'))

    type_stats = aggregate_by_type(df_energy)
    zip_stats = aggregate_by_zip(df_energy)
    monthly_trends = analyze_temporal_trends(df_energy)

    # Save frontend JSON
    frontend_json = {
        'summary': type_stats,
        'by_zip': zip_stats[:100],  # Top 100 ZIPs
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
    log.info(f"   - {len(zip_stats)} ZIP codes")
    log.info(f"   - {len(monthly_trends)} months of trends")

    return {
        'enriched_csv': enriched_path,
        'energy_csv': energy_path,
        'frontend_json': frontend_path,
    }


def main():
    """Main pipeline execution"""
    parser = argparse.ArgumentParser(description='Undervolt Data Pipeline')
    parser.add_argument('--sample', type=int, help='Sample size for testing (e.g., 100000)')
    parser.add_argument('--skip-clustering', action='store_true', help='Skip clustering step')
    args = parser.parse_args()

    print_banner("UNDERVOLT DATA PIPELINE", char='█')

    start_time = time.time()

    # Detect platform
    platform_name, has_gpu = detect_platform()

    # Check prerequisites
    if not check_prerequisites():
        sys.exit(1)

    try:
        # Execute pipeline steps
        df = step_1_load_data(sample_size=args.sample)
        df = step_2_clean_data(df)
        df = step_3_nlp_enrich(df)

        if not args.skip_clustering:
            df = step_4_clustering(df)
        else:
            log.info("⏭️  Skipping clustering (--skip-clustering flag)")

        df_energy = step_5_extract_energy(df)
        outputs = step_6_save_outputs(df, df_energy)

        # Print summary
        elapsed = time.time() - start_time
        print_banner("PIPELINE COMPLETE", char='█')

        log.info(f"⏱️  Total time: {elapsed:.1f} seconds")
        log.info(f"📊 Processed: {len(df):,} total permits")
        log.info(f"⚡ Found: {len(df_energy):,} energy permits")
        log.info(f"")
        log.info(f"Output files:")
        for name, path in outputs.items():
            log.info(f"  - {path}")

        log.info(f"")
        log.info(f"Next steps:")
        log.info(f"  1. View data: npm run db:studio")
        log.info(f"  2. Ingest to DB: npm run db:ingest")
        log.info(f"  3. Start frontend: cd frontend && bun run dev")

        return 0

    except Exception as e:
        log.error(f"❌ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
