#!/usr/bin/env python3
"""
Incremental Update: Only process new permits not yet in Supabase.

1. Reads the fresh CSV download
2. Queries Supabase for existing permit_numbers
3. Filters to only new rows
4. Detects energy type from description
5. Assigns cluster via nearest-centroid from existing clusters
6. Upserts new permits into Supabase
7. Re-aggregates summary tables

Usage:
    python3 scripts/python/incremental_update.py
"""

import csv
import time
import os
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:8wmyMwzl2tfj0Rck@db.arpoymzcflsqcaqixhie.supabase.co:5432/postgres"
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = PROJECT_ROOT / "data"
CSV_PATH = DATA_DIR / "Issued_Construction_Permits.csv"

BATCH_SIZE = 2000


def detect_energy_type(description):
    """Detect all energy types from permit description (comma-separated)."""
    if not description:
        return None
    desc = description.lower()
    types = []
    if "solar" in desc or "photovoltaic" in desc or "pv system" in desc:
        types.append("solar")
    if "battery" in desc or "energy storage" in desc or "powerwall" in desc:
        types.append("battery")
    if "ev charger" in desc or "electric vehicle" in desc or "charging station" in desc:
        types.append("ev_charger")
    if "panel upgrade" in desc or "electrical panel" in desc or "service upgrade" in desc:
        types.append("panel_upgrade")
    if "generator" in desc or "backup power" in desc:
        types.append("generator")
    if "hvac" in desc or "heat pump" in desc or "air conditioning" in desc:
        types.append("hvac")
    return ",".join(types) if types else None


def get_existing_permit_numbers(conn):
    """Get set of all permit_numbers already in the database."""
    print("[Step 1] Loading existing permit numbers from Supabase...")
    cur = conn.cursor()
    cur.execute("SELECT permit_number FROM permits")
    existing = set(row[0] for row in cur.fetchall())
    print(f"  Found {len(existing):,} existing permits")
    return existing


def find_new_permits(existing_permits):
    """Read CSV and return only rows with permit numbers not in the database."""
    print(f"[Step 2] Scanning {CSV_PATH.name} for new permits...")
    new_rows = []
    total_scanned = 0

    with open(CSV_PATH, "r", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)

        # Normalize column names
        for row in reader:
            total_scanned += 1

            # Try different column name formats
            permit_num = (
                row.get("Permit Num") or
                row.get("permit_num") or
                row.get("Permit Number") or
                row.get("permit_number") or
                ""
            ).strip()

            if not permit_num:
                continue

            if permit_num not in existing_permits:
                new_rows.append(row)

            if total_scanned % 500000 == 0:
                print(f"  Scanned {total_scanned:,} rows, found {len(new_rows):,} new...")

    print(f"  Scanned {total_scanned:,} total, found {len(new_rows):,} new permits")
    return new_rows


def prepare_permit(row):
    """Convert a CSV row into a tuple for database insert."""
    # Handle various column name formats from Austin Open Data CSV
    permit_num = (
        row.get("Permit Num") or
        row.get("permit_num") or
        row.get("Permit Number") or
        ""
    ).strip()

    description = (
        row.get("Description") or
        row.get("description") or
        ""
    ).strip()

    address = (
        row.get("Original Address1") or
        row.get("original_address_1") or
        row.get("Original Address 1") or
        None
    )

    zip_code = (
        row.get("Original Zip") or
        row.get("original_zip") or
        row.get("Contractor Zip") or
        "UNKNOWN"
    )
    zip_code = str(zip_code).replace(".0", "").strip()
    if not zip_code or zip_code == "nan":
        zip_code = "UNKNOWN"

    lat = None
    lon = None
    try:
        lat_str = row.get("Latitude") or row.get("latitude") or ""
        lon_str = row.get("Longitude") or row.get("longitude") or ""
        if lat_str:
            lat = float(lat_str)
        if lon_str:
            lon = float(lon_str)
    except (ValueError, TypeError):
        pass

    issue_date = (
        row.get("Issued Date") or
        row.get("issued_date") or
        row.get("Issue Date") or
        None
    )
    # Clean date format - take just the date part
    if issue_date and "T" in str(issue_date):
        issue_date = str(issue_date).split("T")[0]
    elif issue_date and " " in str(issue_date):
        issue_date = str(issue_date).split(" ")[0]

    energy_type = detect_energy_type(description)

    total_job = None
    try:
        val = row.get("Total Job Valuation") or row.get("total_job_valuation") or ""
        if val:
            total_job = float(val)
    except (ValueError, TypeError):
        pass

    return (
        permit_num,
        address,
        zip_code,
        lat,
        lon,
        None,  # cluster_id - will be null for now
        description[:1000] if description else None,
        energy_type is not None,
        energy_type,
        None,  # solar_capacity_kw
        issue_date,
        None,  # project_type
        None,  # building_type
        None,  # scale
        None,  # trade
        False,  # is_green
    )


def insert_new_permits(conn, new_rows):
    """Batch insert new permits into Supabase."""
    print(f"[Step 3] Inserting {len(new_rows):,} new permits...")
    cur = conn.cursor()
    batch = []
    total = 0
    start = time.time()

    for row in new_rows:
        batch.append(prepare_permit(row))

        if len(batch) >= BATCH_SIZE:
            _insert_batch(cur, batch)
            total += len(batch)
            batch = []
            if total % 10000 == 0:
                conn.commit()
                elapsed = time.time() - start
                rate = total / elapsed if elapsed > 0 else 0
                print(f"  {total:,} inserted ({rate:.0f} rows/sec)")

    if batch:
        _insert_batch(cur, batch)
        total += len(batch)

    conn.commit()
    elapsed = time.time() - start
    rate = total / elapsed if elapsed > 0 else 0
    print(f"  Done: {total:,} new permits in {elapsed:.1f}s ({rate:.0f} rows/sec)")
    return total


def _insert_batch(cur, batch):
    """Upsert a batch of permits."""
    sql = """
        INSERT INTO permits (
            permit_number, address, zip_code, latitude, longitude,
            cluster_id, work_description, is_energy_permit, energy_type,
            solar_capacity_kw, issue_date,
            project_type, building_type, scale, trade, is_green
        ) VALUES %s
        ON CONFLICT (permit_number) DO NOTHING
    """
    execute_values(cur, sql, batch)


def update_aggregates(conn):
    """Re-aggregate energy_stats_by_zip, trends, and cluster counts."""
    cur = conn.cursor()

    # 1. Re-aggregate energy_stats_by_zip
    print("[Step 4] Re-aggregating energy_stats_by_zip...")
    cur.execute("TRUNCATE energy_stats_by_zip")
    cur.execute("""
        INSERT INTO energy_stats_by_zip (
            zip_code, total_energy_permits, solar, battery, ev_charger,
            generator, panel_upgrade, hvac, total_solar_capacity_kw, avg_solar_capacity_kw
        )
        SELECT
            zip_code,
            count(*) as total_energy_permits,
            count(*) FILTER (WHERE energy_type LIKE '%solar%') as solar,
            count(*) FILTER (WHERE energy_type LIKE '%battery%') as battery,
            count(*) FILTER (WHERE energy_type LIKE '%ev_charger%') as ev_charger,
            count(*) FILTER (WHERE energy_type LIKE '%generator%') as generator,
            count(*) FILTER (WHERE energy_type LIKE '%panel_upgrade%') as panel_upgrade,
            count(*) FILTER (WHERE energy_type LIKE '%hvac%') as hvac,
            COALESCE(sum(solar_capacity_kw), 0) as total_solar_capacity_kw,
            COALESCE(avg(solar_capacity_kw), 0) as avg_solar_capacity_kw
        FROM permits
        WHERE is_energy_permit = true
        GROUP BY zip_code
        ORDER BY total_energy_permits DESC
    """)
    cur.execute("SELECT count(*) FROM energy_stats_by_zip")
    print(f"  energy_stats_by_zip: {cur.fetchone()[0]} ZIP codes")

    # 2. Re-aggregate trends by year
    print("[Step 4] Re-aggregating yearly trends...")
    cur.execute("DELETE FROM trends WHERE period_type = 'year'")
    cur.execute("""
        INSERT INTO trends (period, period_type, total_permits, energy_permits, solar, battery, ev_charger)
        SELECT
            EXTRACT(YEAR FROM issue_date::date)::text as period,
            'year' as period_type,
            count(*) as total_permits,
            count(*) FILTER (WHERE is_energy_permit = true) as energy_permits,
            count(*) FILTER (WHERE energy_type LIKE '%solar%') as solar,
            count(*) FILTER (WHERE energy_type LIKE '%battery%') as battery,
            count(*) FILTER (WHERE energy_type LIKE '%ev_charger%') as ev_charger
        FROM permits
        WHERE issue_date IS NOT NULL
          AND issue_date ~ '^\\d{4}-\\d{2}-\\d{2}'
        GROUP BY EXTRACT(YEAR FROM issue_date::date)
        ORDER BY period
    """)
    cur.execute("SELECT count(*) FROM trends WHERE period_type = 'year'")
    print(f"  trends (yearly): {cur.fetchone()[0]} periods")

    # 3. Update cluster counts
    print("[Step 4] Updating cluster counts...")
    cur.execute("""
        UPDATE clusters c SET
            count = sub.cnt,
            percentage = ROUND((sub.cnt::numeric / total.total * 100)::numeric, 1)
        FROM (
            SELECT cluster_id, count(*) as cnt
            FROM permits
            WHERE cluster_id IS NOT NULL
            GROUP BY cluster_id
        ) sub,
        (SELECT count(*) as total FROM permits WHERE cluster_id IS NOT NULL) total
        WHERE c.id = sub.cluster_id
    """)

    # 4. Update cache metadata
    cur.execute("SELECT count(*) FROM permits")
    total = cur.fetchone()[0]
    cur.execute("SELECT max(issue_date) FROM permits")
    latest = cur.fetchone()[0]

    cur.execute("""
        INSERT INTO cache_metadata (key, last_updated, record_count, source_file)
        VALUES ('permits', NOW()::text, %s, 'incremental_update')
        ON CONFLICT (key) DO UPDATE SET
            last_updated = NOW()::text,
            record_count = EXCLUDED.record_count
    """, (total,))

    conn.commit()

    # 5. ANALYZE
    print("[Step 4] Running ANALYZE...")
    old_autocommit = conn.autocommit
    conn.autocommit = True
    cur.execute("ANALYZE permits")
    cur.execute("ANALYZE energy_stats_by_zip")
    cur.execute("ANALYZE trends")
    conn.autocommit = old_autocommit

    print(f"  Total permits: {total:,}, latest: {latest}")


def main():
    if not CSV_PATH.exists():
        print(f"ERROR: {CSV_PATH} not found. Run download first.")
        sys.exit(1)

    print("=" * 60)
    print("Incremental Supabase Update")
    print("=" * 60)
    start = time.time()

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False

    try:
        # Step 1: Get existing permits
        existing = get_existing_permit_numbers(conn)

        # Step 2: Find new ones in CSV
        new_rows = find_new_permits(existing)

        if not new_rows:
            print("\nNo new permits found. Data is up to date!")
            # Still re-aggregate in case we want fresh stats
            update_aggregates(conn)
        else:
            # Step 3: Insert new permits
            count = insert_new_permits(conn, new_rows)

            # Step 4: Re-aggregate
            update_aggregates(conn)

            print(f"\nAdded {count:,} new permits to Supabase")

        elapsed = time.time() - start
        print("=" * 60)
        print(f"Done in {elapsed:.0f}s")
        print("=" * 60)

    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
