#!/usr/bin/env python3
"""
Fix CSV multiline fields for Node.js csv-parse compatibility.

The Austin permit data has description fields with embedded newlines
that confuse some CSV parsers. This script:
1. Properly reads multiline CSV fields
2. Replaces newlines within fields with spaces
3. Outputs a clean CSV that any parser can read
"""

import csv
import sys
from pathlib import Path

def fix_csv(input_path: str, output_path: str):
    """Fix multiline fields in CSV."""

    print(f"Reading: {input_path}")

    # Read with Python's robust CSV parser
    with open(input_path, 'r', encoding='utf-8', errors='replace') as infile:
        reader = csv.DictReader(infile)
        fieldnames = reader.fieldnames

        rows = []
        for i, row in enumerate(reader):
            # Clean all fields - replace newlines with spaces
            cleaned = {}
            for key, value in row.items():
                if value and isinstance(value, str):
                    cleaned[key] = value.replace('\n', ' ').replace('\r', ' ')
                else:
                    cleaned[key] = value
            rows.append(cleaned)

            if (i + 1) % 25000 == 0:
                print(f"  Processed {i + 1:,} rows...")

    print(f"  Total rows read: {len(rows):,}")

    # Write clean CSV
    print(f"Writing: {output_path}")
    with open(output_path, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Done! {len(rows):,} rows written")
    return len(rows)


if __name__ == "__main__":
    input_file = "output/permit_data_named_clusters.csv"
    output_file = "output/permit_data_clean.csv"

    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    if len(sys.argv) > 2:
        output_file = sys.argv[2]

    fix_csv(input_file, output_file)
