#!/usr/bin/env python3
"""
Ingest pipeline output into Supabase Postgres.

Reads permit_data_named_clusters.csv (pipeline output) and upserts into Supabase.
Then re-aggregates energy_stats_by_zip, clusters, and trends tables.

Usage:
    python3 scripts/python/ingest_supabase.py
    python3 scripts/python/ingest_supabase.py --aggregates-only  # Skip permit upsert
"""

import csv
import sys
import time
import os
import json
import gzip
import re
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:8wmyMwzl2tfj0Rck@db.arpoymzcflsqcaqixhie.supabase.co:5432/postgres"
)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUT_DIR = PROJECT_ROOT / "output"
DATA_DIR = PROJECT_ROOT / "data"
PUBLIC_DATA_DIR = PROJECT_ROOT / "frontend" / "public" / "data"

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


def open_csv(path):
    """Open a CSV file, handling .gz compression."""
    if str(path).endswith(".gz"):
        return gzip.open(path, "rt", encoding="utf-8", errors="replace")
    return open(path, "r", encoding="utf-8", errors="replace")


def ingest_permits(conn):
    """Stream permits from pipeline CSV and upsert into Supabase."""
    # Try uncompressed first, then compressed
    csv_path = OUTPUT_DIR / "permit_data_named_clusters.csv"
    if not csv_path.exists():
        csv_path = OUTPUT_DIR / "permit_data_named_clusters.csv.gz"
    if not csv_path.exists():
        print(f"[Permits] ERROR: No pipeline output found at {csv_path}")
        return False

    print(f"[Permits] Loading from {csv_path}...")

    # Load LLM categories if available
    llm_cats = {}
    llm_path = DATA_DIR / "llm_categories.json"
    if llm_path.exists():
        with open(llm_path) as f:
            llm_data = json.load(f)
            llm_cats = llm_data.get("permits", {})
        print(f"[Permits] Loaded {len(llm_cats)} LLM categories")

    cur = conn.cursor()
    batch = []
    total = 0
    start = time.time()

    with open_csv(csv_path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            description = row.get("description", "") or ""
            energy_type = detect_energy_type(description)
            permit_num = row.get("permit_num", "") or f"PERMIT_{total}_{int(time.time())}"
            llm = llm_cats.get(permit_num, {})

            zip_code = row.get("zip_code", "UNKNOWN") or "UNKNOWN"
            zip_code = str(zip_code).replace(".0", "")

            lat = None
            lon = None
            try:
                lat = float(row.get("latitude", "")) if row.get("latitude") else None
                lon = float(row.get("longitude", "")) if row.get("longitude") else None
            except (ValueError, TypeError):
                pass

            cluster_id = None
            try:
                cluster_id = int(row["f_cluster"]) if row.get("f_cluster") else None
            except (ValueError, TypeError):
                pass

            total_job = None
            try:
                total_job = float(row["total_job_valuation"]) if row.get("total_job_valuation") else None
            except (ValueError, TypeError):
                pass

            batch.append((
                permit_num,
                row.get("original_address_1") or None,
                zip_code,
                lat,
                lon,
                cluster_id,
                description[:1000] if description else None,
                energy_type is not None,
                energy_type,
                None,  # solar_capacity_kw
                row.get("issued_date") or None,
                llm.get("project_type") or None,
                llm.get("building_type") or None,
                llm.get("scale") or None,
                llm.get("trade") or None,
                llm.get("is_green") in (True, "true"),
            ))

            if len(batch) >= BATCH_SIZE:
                _insert_batch(cur, batch)
                total += len(batch)
                batch = []
                if total % 100000 == 0:
                    conn.commit()
                    elapsed = time.time() - start
                    rate = total / elapsed if elapsed > 0 else 0
                    print(f"[Permits] {total:,} inserted ({rate:.0f} rows/sec)")

    # Final batch
    if batch:
        _insert_batch(cur, batch)
        total += len(batch)

    conn.commit()
    elapsed = time.time() - start
    rate = total / elapsed if elapsed > 0 else 0
    print(f"[Permits] Done: {total:,} permits in {elapsed:.0f}s ({rate:.0f} rows/sec)")
    return True


def _insert_batch(cur, batch):
    """Upsert a batch of permits."""
    sql = """
        INSERT INTO permits (
            permit_number, address, zip_code, latitude, longitude,
            cluster_id, work_description, is_energy_permit, energy_type,
            solar_capacity_kw, issue_date,
            project_type, building_type, scale, trade, is_green
        ) VALUES %s
        ON CONFLICT (permit_number) DO UPDATE SET
            cluster_id = EXCLUDED.cluster_id,
            is_energy_permit = EXCLUDED.is_energy_permit,
            energy_type = EXCLUDED.energy_type,
            project_type = EXCLUDED.project_type,
            building_type = EXCLUDED.building_type,
            scale = EXCLUDED.scale,
            trade = EXCLUDED.trade,
            is_green = EXCLUDED.is_green
    """
    execute_values(cur, sql, batch)


def update_aggregates(conn):
    """Re-aggregate energy_stats_by_zip and trends from permits table."""
    cur = conn.cursor()

    # 1. Re-aggregate energy_stats_by_zip
    print("[Aggregates] Updating energy_stats_by_zip...")
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
    print(f"[Aggregates] energy_stats_by_zip: {cur.fetchone()[0]} ZIP codes")

    # 2. Re-aggregate trends by year
    print("[Aggregates] Updating trends...")
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
          AND issue_date ~ '^\d{4}-\d{2}-\d{2}'
        GROUP BY EXTRACT(YEAR FROM issue_date::date)
        ORDER BY period
    """)
    cur.execute("SELECT count(*) FROM trends WHERE period_type = 'year'")
    print(f"[Aggregates] trends (yearly): {cur.fetchone()[0]} periods")

    # 3. Update cluster counts
    print("[Aggregates] Updating cluster counts...")
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

    # 4. Update cache_metadata
    cur.execute("SELECT count(*) FROM permits")
    total_permits = cur.fetchone()[0]
    cur.execute("SELECT max(issue_date) FROM permits")
    latest_date = cur.fetchone()[0]

    cur.execute("""
        INSERT INTO cache_metadata (key, last_updated, record_count, source_file)
        VALUES ('permits', NOW()::text, %s, 'permit_data_named_clusters.csv')
        ON CONFLICT (key) DO UPDATE SET
            last_updated = NOW()::text,
            record_count = EXCLUDED.record_count
    """, (total_permits,))

    conn.commit()

    # 5. Run ANALYZE
    print("[Aggregates] Running ANALYZE...")
    cur.execute("ANALYZE permits")
    cur.execute("ANALYZE energy_stats_by_zip")
    cur.execute("ANALYZE trends")
    cur.execute("ANALYZE clusters")
    conn.commit()

    print(f"[Aggregates] Done. {total_permits:,} total permits, latest: {latest_date}")


def main():
    aggregates_only = "--aggregates-only" in sys.argv

    print("=" * 60)
    print("Supabase Data Ingestion")
    print("=" * 60)

    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    start = time.time()

    try:
        if not aggregates_only:
            ok = ingest_permits(conn)
            if not ok:
                print("Permit ingestion failed, aborting.")
                sys.exit(1)

        update_aggregates(conn)

        elapsed = time.time() - start
        print("=" * 60)
        print(f"All done in {elapsed:.0f}s")
        print("=" * 60)
    except Exception as e:
        conn.rollback()
        print(f"ERROR: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
