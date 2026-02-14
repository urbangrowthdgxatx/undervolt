#!/usr/bin/env python3
"""LLM Categorization - Parallel + Big Batches (5-10x faster)"""

import sqlite3
import json
import requests
import time
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"
DB_PATH = "/home/red/Documents/github/undervolt/data/undervolt.db"
PROGRESS_FILE = "/home/red/Documents/github/undervolt/data/llm_fast_progress.json"

BATCH_SIZE = 20      # Permits per LLM call
PARALLEL = 1         # Single-threaded to avoid Ollama overload
SAVE_EVERY = 300

PROMPT = """Categorize permits by trade.
{permits}
JSON array: [{{"id":N,"trade":"X"}}]
Trades: electrical/plumbing/hvac/structural/roofing/general/foundation/irrigation/gas/demolition"""

def query_ollama(batch):
    permits_text = "\n".join([f"{id}: {desc[:100]}" for id, desc in batch])
    try:
        resp = requests.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": PROMPT.format(permits=permits_text),
            "stream": False,
            "keep_alive": "24h",
            "options": {"temperature": 0.1, "num_predict": 350, "num_ctx": 2048}
        }, timeout=120)
        text = resp.json().get("response", "").strip()
        if "```" in text:
            text = text.split("```")[1].split("```")[0]
            if text.startswith("json"):
                text = text[4:]
        return batch, json.loads(text)
    except:
        return batch, []

def main():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    cur = conn.cursor()

    # Ensure column
    cur.execute("PRAGMA table_info(permits)")
    if 'llm_trade' not in [r[1] for r in cur.fetchall()]:
        cur.execute("ALTER TABLE permits ADD COLUMN llm_trade TEXT")
        conn.commit()

    # Load progress
    prog = {"last_id": 0, "count": 0}
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            prog = json.load(f)

    # Count remaining
    cur.execute("SELECT COUNT(*) FROM permits WHERE id > ? AND work_description IS NOT NULL", (prog['last_id'],))
    remaining = cur.fetchone()[0]

    print(f"Config: {BATCH_SIZE}/batch × {PARALLEL} parallel")
    print(f"Resume from: {prog['count']:,} | Remaining: {remaining:,}\n")

    start = time.time()
    session_count = 0

    while True:
        cur.execute("""SELECT id, work_description FROM permits
                      WHERE id > ? AND work_description IS NOT NULL
                      ORDER BY id LIMIT ?""", (prog['last_id'], BATCH_SIZE * PARALLEL * 4))
        rows = cur.fetchall()
        if not rows:
            break

        batches = [rows[i:i+BATCH_SIZE] for i in range(0, len(rows), BATCH_SIZE)]

        with ThreadPoolExecutor(max_workers=PARALLEL) as executor:
            futures = [executor.submit(query_ollama, b) for b in batches]

            for future in as_completed(futures):
                batch, results = future.result()
                for item in (results if isinstance(results, list) else []):
                    if isinstance(item, dict) and 'id' in item and 'trade' in item:
                        cur.execute("UPDATE permits SET llm_trade=? WHERE id=?",
                                   (item['trade'], item['id']))

                prog['last_id'] = max(prog['last_id'], batch[-1][0])
                prog['count'] += len(batch)
                session_count += len(batch)

        if session_count >= SAVE_EVERY:
            conn.commit()
            with open(PROGRESS_FILE, 'w') as f:
                json.dump(prog, f)
            elapsed = time.time() - start
            rate = session_count / elapsed
            eta = (remaining - session_count) / rate / 3600 if rate > 0 else 0
            print(f"  [{prog['count']:,}] {rate:.1f}/s | ETA: {eta:.1f}h")
            session_count = 0
            start = time.time()

    conn.commit()
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(prog, f)
    print(f"\nDone! Total: {prog['count']:,}")

if __name__ == "__main__":
    print("Warming up model...")
    try:
        requests.post(OLLAMA_URL, json={"model": MODEL, "prompt": "hi", "stream": False, "keep_alive": "24h"}, timeout=180)
    except:
        print("Warmup timeout - continuing anyway")
    main()
