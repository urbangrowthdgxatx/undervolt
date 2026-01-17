#!/usr/bin/env python3
"""LLM Categorization - Only for 'other' rule_trade (unmatched by rules)"""

import sqlite3
import re
import requests
import time
import os
import json

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"
DB_PATH = "/home/red/Documents/github/undervolt/data/undervolt.db"
PROGRESS_FILE = "/home/red/Documents/github/undervolt/data/llm_other_progress.json"
BATCH_SIZE = 20  # Smaller batches for cleaner output
SAVE_EVERY = 200

VALID_TRADES = {'electrical', 'plumbing', 'hvac', 'roofing', 'demolition', 'general',
                'mechanical', 'foundation', 'gas', 'structural', 'pool', 'fence',
                'landscaping', 'interior', 'commercial', 'residential', 'signage'}

def query_ollama(batch, timeout=60):
    """Query LLM with simple line-based output"""
    lines = "\n".join([f"{i+1}: {desc[:80]}" for i, (_, desc) in enumerate(batch)])

    prompt = f"""Classify each permit by trade. Reply with ONLY the trade word for each line, numbered.
Trades: electrical, plumbing, hvac, roofing, demolition, general, mechanical, foundation, gas, structural, pool, fence, landscaping, interior, commercial, residential, signage

{lines}"""

    try:
        resp = requests.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "keep_alive": "24h",
            "options": {"temperature": 0, "num_predict": 200, "num_ctx": 1024}
        }, timeout=timeout)

        text = resp.json().get("response", "").strip().lower()
        if not text:
            return {}

        # Parse numbered responses: "1. electrical" or "1: electrical" or "1 electrical"
        results = {}
        for line in text.split('\n'):
            match = re.match(r'(\d+)[.:\s-]+\s*(\w+)', line.strip())
            if match:
                idx = int(match.group(1)) - 1
                trade = match.group(2).lower()
                if 0 <= idx < len(batch) and trade in VALID_TRADES:
                    results[batch[idx][0]] = trade
        return results
    except Exception as e:
        return {}

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"last_id": 0, "count": 0, "updated": 0}

def save_progress(prog):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(prog, f)

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    prog = load_progress()
    print(f"Resuming from ID {prog['last_id']}, processed {prog['count']}, updated {prog.get('updated', 0)}")

    # Only get permits where rule_trade = 'other'
    cur.execute("""
        SELECT id, work_description FROM permits
        WHERE id > ?
          AND rule_trade = 'other'
          AND work_description IS NOT NULL
          AND work_description != ''
        ORDER BY id LIMIT 100000
    """, (prog['last_id'],))

    rows = cur.fetchall()
    total = len(rows)
    print(f"Processing {total:,} 'other' permits in batches of {BATCH_SIZE}...")

    if total == 0:
        print("No more 'other' permits to process!")
        return

    start = time.time()
    processed = 0
    updated = prog.get('updated', 0)

    for i in range(0, total, BATCH_SIZE):
        batch = rows[i:i+BATCH_SIZE]
        result = query_ollama(batch)

        for permit_id, trade in result.items():
            cur.execute("UPDATE permits SET llm_trade = ? WHERE id = ?", (trade, permit_id))
            updated += 1

        prog['last_id'] = batch[-1][0]
        prog['count'] += len(batch)
        prog['updated'] = updated
        processed += len(batch)

        if processed % SAVE_EVERY == 0:
            conn.commit()
            save_progress(prog)
            elapsed = time.time() - start
            rate = processed / elapsed
            eta = (total - processed) / rate if rate > 0 else 0
            pct = updated / processed * 100 if processed > 0 else 0
            print(f"  [{processed:,}/{total:,}] {rate:.1f}/s | Updated: {updated:,} ({pct:.0f}%) | ETA: {eta/60:.1f}m")

    conn.commit()
    save_progress(prog)
    elapsed = time.time() - start
    print(f"\nDone batch! Processed {processed:,}, updated {updated:,} in {elapsed:.1f}s")

if __name__ == "__main__":
    main()
