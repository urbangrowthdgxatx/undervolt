#!/usr/bin/env python3
"""
vLLM Comprehensive Extraction Pipeline
Extracts 15 features from ALL permits using vLLM on GPU.

Features:
- 50 concurrent requests to vLLM
- Batch CSV saves for crash recovery
- Auto-resume from last batch
- Reads from Postgres, saves batches to CSV

Usage:
    python extract_vllm.py

Environment:
    DATABASE_URL - Postgres connection string
    VLLM_URL - vLLM endpoint (default: http://localhost:8000/v1/chat/completions)
"""
import asyncio
import aiohttp
import json
import os
import re
import time
import psycopg2
import pandas as pd
from pathlib import Path

# Config
VLLM_URL = os.environ.get("VLLM_URL", "http://localhost:8000/v1/chat/completions")
MODEL = os.environ.get("MODEL", "meta-llama/Llama-3.1-8B-Instruct")
DB_URL = os.environ.get("DATABASE_URL")

CONCURRENT = 50
BATCH_SIZE = 1000
OUTPUT_DIR = Path("output/comprehensive")

SYSTEM = """Extract features from Austin construction permit. Return ONLY valid JSON.

Fields (null if not mentioned):
- is_solar: bool - solar/PV/photovoltaic
- solar_kw: num - system size kW
- is_ev: bool - EV charger/charging station
- has_battery: bool - powerwall/battery storage
- has_generator: bool - generator/generac/kohler/standby
- gen_kw: num - generator kW
- is_heat_pump: bool - heat pump/mini-split
- panel_upgrade: bool - panel/service upgrade
- amps: num - amperage (100/200/400)
- is_adu: bool - ADU/accessory dwelling/guest house
- is_pool: bool - pool/spa installation
- is_new_build: bool - new construction/new home
- is_remodel: bool - remodel/renovation/addition
- sqft: num - square footage mentioned
- prop_type: str - "sf"/"mf"/"com" (single-family/multi-family/commercial)

Ex: "New 2500sf home with 10kW solar" -> {"is_solar":true,"solar_kw":10,"is_ev":false,"has_battery":false,"has_generator":false,"gen_kw":null,"is_heat_pump":false,"panel_upgrade":false,"amps":null,"is_adu":false,"is_pool":false,"is_new_build":true,"is_remodel":false,"sqft":2500,"prop_type":"sf"}

JSON only:"""

EMPTY_RESULT = {
    "is_solar": None, "solar_kw": None, "is_ev": None, "has_battery": None,
    "has_generator": None, "gen_kw": None, "is_heat_pump": None,
    "panel_upgrade": None, "amps": None, "is_adu": None, "is_pool": None,
    "is_new_build": None, "is_remodel": None, "sqft": None, "prop_type": None
}


async def extract_one(session, semaphore, permit_num, description):
    """Extract features from one permit."""
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": description[:400]}
        ],
        "temperature": 0.1,
        "max_tokens": 250
    }

    async with semaphore:
        try:
            async with session.post(VLLM_URL, json=payload, timeout=aiohttp.ClientTimeout(total=60)) as resp:
                data = await resp.json()
                content = data["choices"][0]["message"]["content"]
                json_match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
                if json_match:
                    features = json.loads(json_match.group())
                    return {"permit_number": permit_num, **features}
        except Exception:
            pass
    return {"permit_number": permit_num, **EMPTY_RESULT}


async def extract_batch(permits, batch_num):
    """Extract features from a batch of permits."""
    semaphore = asyncio.Semaphore(CONCURRENT)
    connector = aiohttp.TCPConnector(limit=CONCURRENT * 2)

    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [extract_one(session, semaphore, p["permit_number"], p["description"]) for p in permits]
        results = []
        start = time.time()

        for i, coro in enumerate(asyncio.as_completed(tasks)):
            result = await coro
            results.append(result)
            if (i + 1) % 100 == 0:
                rate = (i + 1) / (time.time() - start)
                print(f"  Batch {batch_num}: {i+1}/{len(tasks)} ({rate:.1f}/s)")

        return results


def main():
    if not DB_URL:
        print("ERROR: DATABASE_URL environment variable required")
        return

    OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

    print("=" * 60)
    print("COMPREHENSIVE EXTRACTION - 15 FEATURES - ALL PERMITS")
    print("=" * 60)
    print(f"Model: {MODEL}")
    print(f"Endpoint: {VLLM_URL}")
    print(f"Concurrency: {CONCURRENT}")

    # Resume from existing batches
    existing = sorted(OUTPUT_DIR.glob("batch_*.csv"))
    start_offset = len(existing) * BATCH_SIZE
    if start_offset > 0:
        print(f"Resuming from batch {len(existing) + 1} (offset {start_offset:,})")

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM construction_permits")
    total = cur.fetchone()[0]
    print(f"Total permits: {total:,}")

    batch_num = len(existing) + 1
    processed = start_offset
    overall_start = time.time()

    while processed < total:
        print(f"\n{'='*60}")
        print(f"BATCH {batch_num} ({processed:,} - {min(processed + BATCH_SIZE, total):,})")

        cur.execute("""
            SELECT permit_number, description FROM construction_permits
            WHERE description IS NOT NULL
            ORDER BY permit_number OFFSET %s LIMIT %s
        """, (processed, BATCH_SIZE))

        rows = cur.fetchall()
        if not rows:
            break

        permits = [{"permit_number": r[0], "description": r[1]} for r in rows]
        batch_start = time.time()
        results = asyncio.run(extract_batch(permits, batch_num))
        batch_time = time.time() - batch_start

        df = pd.DataFrame(results)
        output_file = OUTPUT_DIR / f"batch_{batch_num:04d}.csv"
        df.to_csv(output_file, index=False)

        # Stats
        rate = len(results) / batch_time
        stats = {k: sum(1 for r in results if r.get(k)) for k in ["is_solar", "is_ev", "has_generator", "is_pool", "is_new_build", "is_adu"]}
        print(f"  {batch_time:.0f}s ({rate:.1f}/s) | solar={stats['is_solar']} ev={stats['is_ev']} gen={stats['has_generator']} pool={stats['is_pool']} new={stats['is_new_build']} adu={stats['is_adu']}")
        print(f"  Saved: {output_file}")

        processed += len(results)
        batch_num += 1

        elapsed = time.time() - overall_start
        overall_rate = (processed - start_offset) / elapsed
        remaining = (total - processed) / overall_rate / 3600 if overall_rate > 0 else 0
        print(f"Progress: {processed:,}/{total:,} ({100*processed/total:.1f}%) | {overall_rate:.1f}/s | ETA: {remaining:.1f}h")

    cur.close()
    conn.close()
    print(f"\nDONE! {batch_num - 1} batches in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
