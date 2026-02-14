#!/usr/bin/env python3
"""
Download Austin Construction Permits Dataset
Source: https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu
"""

import os
import sys
import urllib.request
from pathlib import Path


def download_with_progress(url, output_path):
    """Download file with progress bar"""

    def progress_hook(block_num, block_size, total_size):
        downloaded = block_num * block_size
        if total_size > 0:
            percent = min(100, downloaded * 100 / total_size)
            bar_length = 50
            filled = int(bar_length * percent / 100)
            bar = '█' * filled + '░' * (bar_length - filled)

            size_mb = downloaded / (1024 * 1024)
            total_mb = total_size / (1024 * 1024)

            sys.stdout.write(f'\r{bar} {percent:.1f}% ({size_mb:.1f}/{total_mb:.1f} MB)')
            sys.stdout.flush()

    print(f"Downloading to: {output_path}")
    urllib.request.urlretrieve(url, output_path, progress_hook)
    print()  # New line after progress


def main():
    # Setup paths
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    data_dir = project_root / "data"

    # Create data directory
    data_dir.mkdir(exist_ok=True)

    print("📥 Downloading Austin Construction Permits dataset...")
    print("Source: Austin Open Data Portal")
    print("Dataset: Issued Construction Permits (2.2M+ records)")
    print()

    # Socrata API endpoint for CSV export
    dataset_url = "https://data.austintexas.gov/api/views/3syk-w9eu/rows.csv?accessType=DOWNLOAD"
    output_file = data_dir / "Issued_Construction_Permits_20251212.csv"

    # Download
    try:
        download_with_progress(dataset_url, output_file)

        # Check result
        if output_file.exists():
            file_size = output_file.stat().st_size / (1024 * 1024)  # MB

            with open(output_file, 'r') as f:
                line_count = sum(1 for _ in f) - 1  # Subtract header

            print()
            print("✅ Download complete!")
            print(f"📊 File: {output_file}")
            print(f"📦 Size: {file_size:.1f} MB")
            print(f"📝 Lines: {line_count:,} records (+ 1 header)")
            print()
            print("Next steps:")
            print("  1. Run the pipeline: python pipeline_cudf.py")
            print("  2. Or run test: python test_pipeline.py")
        else:
            print("❌ Download failed!")
            sys.exit(1)

    except Exception as e:
        print(f"❌ Error downloading: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
