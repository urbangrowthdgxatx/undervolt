#!/usr/bin/env python3
"""Rules-based trade categorization - fast regex matching"""

import sqlite3
import re
import time

DB_PATH = "/home/red/Documents/github/undervolt/data/undervolt.db"

# Trade rules: (pattern, trade) - first match wins
TRADE_RULES = [
    # Demolition (check first - often contains other trade words)
    (r'\b(demo|demolition|demolish|tear\s*down|raze)\b', 'demolition'),

    # Electrical
    (r'\b(electric|electrical|wire|wiring|outlet|panel|circuit|breaker|meter|transformer|generator|solar|pv|photovoltaic|ev\s*charg|tesla\s*wall|powerwall|battery\s*storage)\b', 'electrical'),

    # Plumbing
    (r'\b(plumb|plumbing|pipe|piping|water\s*heater|drain|sewer|septic|toilet|sink|faucet|backflow|irrigation|sprinkler|well\s*pump)\b', 'plumbing'),

    # HVAC
    (r'\b(hvac|a/?c|air\s*condition|heat\s*pump|furnace|duct|ductwork|mini\s*split|condenser|compressor|ventilat|exhaust\s*fan)\b', 'hvac'),

    # Roofing
    (r'\b(roof|roofing|shingle|re-?roof|reroof)\b', 'roofing'),

    # Gas
    (r'\b(gas\s*line|gas\s*pipe|natural\s*gas|propane|gas\s*meter|gas\s*service)\b', 'gas'),

    # Foundation
    (r'\b(foundation|slab|pier|footing|concrete\s*pour|grade\s*beam|post\s*tension)\b', 'foundation'),

    # Structural
    (r'\b(structur|beam|column|load\s*bearing|framing|steel|joist|truss|retaining\s*wall)\b', 'structural'),

    # Irrigation (separate from plumbing)
    (r'\b(irrigat|sprinkler\s*system|drip\s*system|landscape\s*water)\b', 'irrigation'),

    # Fire/Safety
    (r'\b(fire\s*alarm|fire\s*sprinkler|fire\s*suppression|smoke\s*detector|fire\s*extinguish)\b', 'fire_safety'),

    # Pool/Spa
    (r'\b(pool|spa|hot\s*tub|swimming)\b', 'pool'),

    # Fence
    (r'\b(fence|fencing|gate)\b', 'fence'),

    # Driveway/Flatwork
    (r'\b(driveway|sidewalk|flatwork|patio|concrete\s*pad)\b', 'flatwork'),

    # Signs
    (r'\b(sign|signage|banner|monument\s*sign)\b', 'signage'),

    # General/Remodel (catch-all for construction)
    (r'\b(remodel|renovation|addition|new\s*construct|build\s*out|tenant\s*improve|finish\s*out|interior\s*alter)\b', 'general'),
]

# Compile patterns for speed
COMPILED_RULES = [(re.compile(pattern, re.IGNORECASE), trade) for pattern, trade in TRADE_RULES]

def categorize(description):
    """Apply rules to categorize a work description"""
    if not description:
        return None

    for pattern, trade in COMPILED_RULES:
        if pattern.search(description):
            return trade

    return 'other'  # No match

def main():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Ensure column exists
    cur.execute("PRAGMA table_info(permits)")
    cols = [r[1] for r in cur.fetchall()]
    if 'rule_trade' not in cols:
        cur.execute("ALTER TABLE permits ADD COLUMN rule_trade TEXT")
        conn.commit()
        print("Added rule_trade column")

    # Get all permits
    cur.execute("""
        SELECT id, work_description FROM permits
        WHERE work_description IS NOT NULL AND work_description != ''
    """)

    rows = cur.fetchall()
    total = len(rows)
    print(f"Processing {total} permits...")

    start = time.time()
    batch = []

    for i, (id, desc) in enumerate(rows):
        trade = categorize(desc)
        batch.append((trade, id))

        if len(batch) >= 10000:
            cur.executemany("UPDATE permits SET rule_trade = ? WHERE id = ?", batch)
            conn.commit()
            elapsed = time.time() - start
            rate = (i + 1) / elapsed
            print(f"  [{i+1:,}/{total:,}] {rate:,.0f}/s")
            batch = []

    # Final batch
    if batch:
        cur.executemany("UPDATE permits SET rule_trade = ? WHERE id = ?", batch)
        conn.commit()

    elapsed = time.time() - start
    print(f"\nDone! Processed {total:,} permits in {elapsed:.1f}s ({total/elapsed:,.0f}/s)")

    # Show distribution
    cur.execute("""
        SELECT rule_trade, COUNT(*) as cnt
        FROM permits
        WHERE rule_trade IS NOT NULL
        GROUP BY rule_trade
        ORDER BY cnt DESC
    """)
    print("\nTrade distribution:")
    for trade, cnt in cur.fetchall():
        pct = cnt / total * 100
        print(f"  {trade:15} {cnt:>8,} ({pct:5.1f}%)")

if __name__ == "__main__":
    main()
