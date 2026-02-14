#!/usr/bin/env python3
"""
LLM-based Permit Categorization

Uses local Ollama (llama3.2:3b) to analyze permit descriptions and generate
semantic categories beyond simple keyword matching.

Categories to extract:
- Project scale: minor/moderate/major
- Building type: residential/commercial/industrial/mixed
- Work nature: new construction/renovation/repair/demolition/upgrade
- Complexity: simple/moderate/complex
- Urgency indicators: express/emergency/standard
"""

import sqlite3
import json
import requests
from collections import defaultdict
import time
import sys

# Use Ollama's native API (faster)
OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "llama3.2:3b"
DB_PATH = "/home/red/Documents/github/undervolt/data/undervolt.db"

# Categories we want to extract
CATEGORY_PROMPT = """Analyze this construction permit description and categorize it.

Description: "{description}"

Return a JSON object with these fields:
- project_type: one of [new_construction, renovation, repair, maintenance, upgrade, demolition, installation]
- building_type: one of [residential_single, residential_multi, commercial, industrial, mixed_use, infrastructure]
- scale: one of [minor, moderate, major]
- trade: one of [electrical, plumbing, hvac, structural, roofing, general, landscaping, foundation]
- is_green: true if related to solar/EV/battery/energy efficiency, false otherwise

Return ONLY the JSON, no explanation."""


def query_ollama(prompt, timeout=30):
    """Query Ollama and parse JSON response"""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "keep_alive": "30m",  # Keep model loaded
                "options": {
                    "temperature": 0.1,  # Low temp for consistent categorization
                    "num_predict": 150,
                }
            },
            timeout=timeout
        )
        response.raise_for_status()

        result = response.json()
        text = result.get("response", "").strip()

        # Try to extract JSON from response
        # Sometimes LLM wraps it in ```json blocks
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        # Parse JSON
        return json.loads(text)
    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e}")
        return None
    except Exception as e:
        print(f"  Ollama error: {e}")
        return None


def categorize_batch(descriptions, batch_size: int = 10) -> dict:
    """Categorize a batch of permit descriptions"""
    results = {}

    for i, (permit_id, desc) in enumerate(descriptions):
        if not desc or len(desc.strip()) < 5:
            continue

        prompt = CATEGORY_PROMPT.format(description=desc[:500])  # Limit length

        categories = query_ollama(prompt)
        if categories:
            results[permit_id] = categories
            print(f"  [{i+1}/{len(descriptions)}] ID {permit_id}: {categories.get('project_type', '?')} / {categories.get('trade', '?')}")
        else:
            print(f"  [{i+1}/{len(descriptions)}] ID {permit_id}: Failed to categorize")

        # Small delay to not overwhelm Ollama
        if (i + 1) % batch_size == 0:
            time.sleep(0.5)

    return results


def analyze_sample(sample_size: int = 100):
    """Analyze a sample of permits to generate category distribution"""
    print(f"\n{'='*60}")
    print(f" LLM PERMIT CATEGORIZATION ".center(60, '='))
    print(f"{'='*60}")

    conn = sqlite3.connect(DB_PATH)

    # Get diverse sample - mix of energy types and non-energy
    print(f"\nLoading {sample_size} diverse permits...")

    # Get sample with variety
    query = """
    SELECT id, work_description, energy_type, cluster_id
    FROM permits
    WHERE work_description IS NOT NULL
    AND length(work_description) > 10
    ORDER BY RANDOM()
    LIMIT ?
    """

    rows = conn.execute(query, (sample_size,)).fetchall()
    print(f"Loaded {len(rows)} permits")

    # Categorize with LLM
    print("\nAnalyzing with LLM (llama3.2:3b)...")
    start_time = time.time()

    descriptions = [(row[0], row[1]) for row in rows]
    categories = categorize_batch(descriptions)

    elapsed = time.time() - start_time
    print(f"\nCategorized {len(categories)} permits in {elapsed:.1f}s")
    print(f"Rate: {len(categories)/elapsed:.1f} permits/sec")

    # Aggregate results
    print("\n" + "="*60)
    print(" CATEGORY DISTRIBUTION ".center(60, '='))
    print("="*60)

    distributions = defaultdict(lambda: defaultdict(int))

    for permit_id, cats in categories.items():
        for field, value in cats.items():
            if isinstance(value, bool):
                value = str(value).lower()
            distributions[field][value] += 1

    for field, counts in sorted(distributions.items()):
        print(f"\n{field.upper()}:")
        for value, count in sorted(counts.items(), key=lambda x: -x[1]):
            pct = (count / len(categories)) * 100
            bar = "█" * int(pct / 5)
            val_str = str(value) if value is not None else "unknown"
            print(f"  {val_str:20s} {count:4d} ({pct:5.1f}%) {bar}")

    # Save results
    output_path = "/home/red/Documents/github/undervolt/data/llm_categories.json"
    with open(output_path, 'w') as f:
        json.dump({
            "metadata": {
                "sample_size": sample_size,
                "categorized": len(categories),
                "model": MODEL,
                "elapsed_seconds": elapsed
            },
            "distributions": {k: dict(v) for k, v in distributions.items()},
            "permits": categories
        }, f, indent=2)

    print(f"\n✅ Saved results to {output_path}")

    conn.close()
    return categories, distributions


def update_database_with_categories(categories: dict):
    """Add LLM category columns to database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check if columns exist, add if not
    cursor.execute("PRAGMA table_info(permits)")
    existing_cols = [row[1] for row in cursor.fetchall()]

    new_cols = ['llm_project_type', 'llm_building_type', 'llm_scale', 'llm_trade', 'llm_is_green']

    for col in new_cols:
        if col not in existing_cols:
            print(f"Adding column: {col}")
            cursor.execute(f"ALTER TABLE permits ADD COLUMN {col} TEXT")

    # Update permits with categories
    print(f"\nUpdating {len(categories)} permits with LLM categories...")

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
            permit_id
        ))

    conn.commit()
    conn.close()
    print("✅ Database updated")


if __name__ == "__main__":
    sample_size = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    auto_update = len(sys.argv) > 2 and sys.argv[2] == '--update'

    categories, distributions = analyze_sample(sample_size)

    # Update DB if --update flag passed, otherwise ask
    if auto_update:
        update_database_with_categories(categories)
    elif sys.stdin.isatty():
        print("\nUpdate database with these categories? (y/n): ", end="")
        if input().strip().lower() == 'y':
            update_database_with_categories(categories)
