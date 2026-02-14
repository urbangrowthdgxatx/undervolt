#!/usr/bin/env python3
"""
LLM Categorization - Full Dataset

Runs LLM categorization on ALL permits with:
- Resume capability (saves progress every 100 permits)
- Incremental database updates
- Progress logging
- Estimated time remaining

Usage:
    python scripts/python/llm_categorize_all.py [--resume] [--batch-size 100]
"""

import sqlite3
import json
import requests
import time
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta

# Configuration
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"
DB_PATH = "/home/red/Documents/github/undervolt/data/undervolt.db"
PROGRESS_FILE = "/home/red/Documents/github/undervolt/data/llm_progress.json"
BATCH_SIZE = 100  # Save progress every N permits

CATEGORY_PROMPT = """Analyze this construction permit and categorize it.

Description: "{description}"

Return JSON with these fields:
- project_type: new_construction/renovation/repair/upgrade/demolition/installation
- building_type: residential_single/residential_multi/commercial/industrial/infrastructure
- scale: minor/moderate/major
- trade: electrical/plumbing/hvac/structural/roofing/general/foundation
- is_green: true if solar/EV/battery/energy related, false otherwise

Return ONLY JSON, no explanation."""


def query_ollama(prompt, timeout=30):
    """Query Ollama with optimized settings"""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "keep_alive": "60m",  # Keep model loaded
                "options": {
                    "temperature": 0.1,
                    "num_predict": 100,  # Minimal tokens
                    "num_ctx": 256,      # Small context
                }
            },
            timeout=timeout
        )
        response.raise_for_status()

        text = response.json().get("response", "").strip()

        # Extract JSON
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        return json.loads(text)
    except Exception as e:
        return None


def load_progress():
    """Load progress from file"""
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE, 'r') as f:
            return json.load(f)
    return {"processed_ids": [], "last_id": 0, "started": None, "categories": {}}


def save_progress(progress):
    """Save progress to file"""
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(progress, f)


def update_database(conn, categories):
    """Update database with LLM categories"""
    cursor = conn.cursor()

    # Ensure columns exist
    cursor.execute("PRAGMA table_info(permits)")
    existing_cols = [row[1] for row in cursor.fetchall()]

    new_cols = ['llm_project_type', 'llm_building_type', 'llm_scale', 'llm_trade', 'llm_is_green']
    for col in new_cols:
        if col not in existing_cols:
            cursor.execute(f"ALTER TABLE permits ADD COLUMN {col} TEXT")

    # Update permits
    for permit_id, cats in categories.items():
        cursor.execute("""
            UPDATE permits SET
                llm_project_type = ?,
                llm_building_type = ?,
                llm_scale = ?,
                llm_trade = ?,
                llm_is_green = ?
            WHERE id = ?
        """, (
            cats.get('project_type'),
            cats.get('building_type'),
            cats.get('scale'),
            cats.get('trade'),
            str(cats.get('is_green', False)).lower(),
            int(permit_id)
        ))

    conn.commit()


def format_time(seconds):
    """Format seconds as HH:MM:SS"""
    return str(timedelta(seconds=int(seconds)))


def main():
    resume = "--resume" in sys.argv

    print(f"\n{'='*60}")
    print(" LLM CATEGORIZATION - FULL DATASET ".center(60, '='))
    print(f"{'='*60}")
    print(f"Model: {MODEL}")
    print(f"Database: {DB_PATH}")
    print(f"Resume: {resume}")

    # Load progress
    progress = load_progress() if resume else {"processed_ids": [], "last_id": 0, "started": None, "categories": {}}
    processed_set = set(progress["processed_ids"])

    if not progress["started"]:
        progress["started"] = datetime.now().isoformat()

    conn = sqlite3.connect(DB_PATH)

    # Get total count and pending permits
    total = conn.execute("SELECT COUNT(*) FROM permits WHERE work_description IS NOT NULL AND length(work_description) > 10").fetchone()[0]

    # Get permits not yet processed
    query = """
        SELECT id, work_description
        FROM permits
        WHERE work_description IS NOT NULL
        AND length(work_description) > 10
        AND id > ?
        ORDER BY id
    """

    cursor = conn.execute(query, (progress["last_id"],))

    print(f"\nTotal permits with descriptions: {total:,}")
    print(f"Already processed: {len(processed_set):,}")
    print(f"Remaining: {total - len(processed_set):,}")

    if len(processed_set) >= total:
        print("\n✅ All permits already categorized!")
        conn.close()
        return

    print(f"\nStarting categorization...")
    print(f"Progress saved every {BATCH_SIZE} permits")
    print(f"Press Ctrl+C to pause (progress will be saved)\n")

    batch_categories = {}
    batch_start = time.time()
    processed_this_session = 0
    start_time = time.time()

    try:
        for row in cursor:
            permit_id, description = row

            # Skip if already processed
            if permit_id in processed_set:
                continue

            # Categorize
            prompt = CATEGORY_PROMPT.format(description=description[:500])
            categories = query_ollama(prompt)

            if categories:
                batch_categories[str(permit_id)] = categories
                progress["categories"][str(permit_id)] = categories

            progress["processed_ids"].append(permit_id)
            progress["last_id"] = permit_id
            processed_set.add(permit_id)
            processed_this_session += 1

            # Progress output
            total_processed = len(processed_set)
            remaining = total - total_processed

            # Calculate ETA
            elapsed = time.time() - start_time
            rate = processed_this_session / elapsed if elapsed > 0 else 1
            eta_seconds = remaining / rate if rate > 0 else 0

            status = "✓" if categories else "✗"
            trade = categories.get('trade', '?') if categories else 'failed'

            print(f"  [{total_processed:,}/{total:,}] ID {permit_id}: {status} {trade:15} | {rate:.1f}/s | ETA: {format_time(eta_seconds)}")

            # Save progress and update DB every batch
            if len(batch_categories) >= BATCH_SIZE:
                print(f"\n  💾 Saving batch ({len(batch_categories)} permits)...")
                update_database(conn, batch_categories)
                save_progress(progress)
                batch_categories = {}
                print(f"  ✓ Saved. Continuing...\n")

        # Final save
        if batch_categories:
            print(f"\n  💾 Saving final batch ({len(batch_categories)} permits)...")
            update_database(conn, batch_categories)
            save_progress(progress)

    except KeyboardInterrupt:
        print(f"\n\n⏸️  Paused! Saving progress...")
        if batch_categories:
            update_database(conn, batch_categories)
        save_progress(progress)
        print(f"   Saved {len(processed_set):,} permits")
        print(f"   Resume with: python {sys.argv[0]} --resume")

    finally:
        conn.close()

    # Summary
    elapsed_total = time.time() - start_time
    print(f"\n{'='*60}")
    print(" SUMMARY ".center(60, '='))
    print(f"{'='*60}")
    print(f"Processed this session: {processed_this_session:,}")
    print(f"Total processed: {len(processed_set):,}/{total:,}")
    print(f"Time elapsed: {format_time(elapsed_total)}")
    print(f"Average rate: {processed_this_session/elapsed_total:.2f} permits/sec")

    if len(processed_set) >= total:
        print(f"\n✅ All permits categorized!")
        # Clean up progress file
        if os.path.exists(PROGRESS_FILE):
            os.remove(PROGRESS_FILE)


if __name__ == "__main__":
    main()
