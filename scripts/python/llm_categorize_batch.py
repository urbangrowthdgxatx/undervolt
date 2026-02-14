#!/usr/bin/env python3
"""LLM Categorization - Batched (10x faster)"""

import sqlite3
import json
import requests
import time
import os

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"
DB_PATH = "/home/red/Documents/github/undervolt/data/undervolt.db"
PROGRESS_FILE = "/home/red/Documents/github/undervolt/data/llm_batch_progress.json"
BATCH_SIZE = 40  # Permits per LLM call (4x faster)
SAVE_EVERY = 100

def query_ollama(batch, timeout=90):
    """Query with JSON priming for reliable output"""
    # Build prompt with first item primed
    permits_text = "\n".join([f"{id}: {desc[:100]}" for id, desc in batch])
    first_id = batch[0][0]

    prompt = f"""Categorize by trade (electrical/plumbing/hvac/structural/roofing/general/foundation/irrigation/gas/demolition).
{permits_text}

[{{"id":{first_id},"trade":\""""

    try:
        resp = requests.post(OLLAMA_URL, json={
            "model": MODEL,
            "prompt": prompt,
            "stream": False,
            "keep_alive": "24h",
            "options": {"temperature": 0, "num_predict": 600, "num_ctx": 2048}
        }, timeout=timeout)

        text = resp.json().get("response", "").strip()
        # Reconstruct full JSON (we primed with opening)
        full_json = '[{"id":' + str(first_id) + ',"trade":"' + text
        # Clean up - find the closing bracket
        if "]" in full_json:
            full_json = full_json[:full_json.rfind("]")+1]
        return json.loads(full_json)
    except Exception as e:
        return []

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return json.load(f)
    return {"last_id": 0, "count": 0}

def save_progress(prog):
    with open(PROGRESS_FILE, 'w') as f:
        json.dump(prog, f)

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Ensure column exists
    cur.execute("PRAGMA table_info(permits)")
    cols = [r[1] for r in cur.fetchall()]
    if 'llm_trade' not in cols:
        cur.execute("ALTER TABLE permits ADD COLUMN llm_trade TEXT")
        conn.commit()
    
    prog = load_progress()
    print(f"Resuming from ID {prog['last_id']}, processed {prog['count']}")
    
    # Get permits
    cur.execute("""
        SELECT id, work_description FROM permits 
        WHERE id > ? AND work_description IS NOT NULL AND work_description != ''
        ORDER BY id LIMIT 100000
    """, (prog['last_id'],))
    
    rows = cur.fetchall()
    total = len(rows)
    print(f"Processing {total} permits in batches of {BATCH_SIZE}...")
    
    start = time.time()
    processed = 0
    
    for i in range(0, total, BATCH_SIZE):
        batch = rows[i:i+BATCH_SIZE]
        result = query_ollama(batch)  # Now takes batch directly
        time.sleep(0.5)  # Throttle GPU usage (~50-60%)
        
        if result and isinstance(result, list):
            for item in result:
                if isinstance(item, dict) and 'id' in item and 'trade' in item:
                    cur.execute("UPDATE permits SET llm_trade = ? WHERE id = ?", 
                               (item['trade'], item['id']))
        
        prog['last_id'] = batch[-1][0]
        prog['count'] += len(batch)
        processed += len(batch)
        
        if processed % SAVE_EVERY == 0:
            conn.commit()
            save_progress(prog)
            elapsed = time.time() - start
            rate = processed / elapsed
            eta = (total - processed) / rate if rate > 0 else 0
            print(f"  [{processed}/{total}] {rate:.1f}/s | ETA: {eta/3600:.1f}h")
    
    conn.commit()
    save_progress(prog)
    print(f"Done! Processed {processed} permits")

if __name__ == "__main__":
    main()
