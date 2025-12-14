#!/usr/bin/env python3
"""
Parallel Extraction Pipeline
Uses async requests to Ollama for concurrent inference.
Reads config from YAML files for keywords and prompt.
"""

import asyncio
import argparse
import json
import re
import time
from pathlib import Path
import aiohttp
import yaml
import pandas as pd

# Default settings
MAX_CONCURRENT = 8   # Parallel requests to Ollama
MAX_TOKENS = 120     # Enough for 11 fields


def load_configs(config_dir: Path):
    """Load pipeline and feature configs."""
    with open(config_dir / "pipeline.yaml") as f:
        pipeline = yaml.safe_load(f)

    # Load first enabled feature config
    for yaml_file in (config_dir / "features").glob("*.yaml"):
        with open(yaml_file) as f:
            feature = yaml.safe_load(f)
        if feature["feature_group"].get("enabled", True):
            return pipeline, feature

    raise ValueError("No enabled feature configs found!")


def build_prompt(description: str, feature_config: dict) -> str:
    """Build LLM prompt from feature config - compact, no examples for speed."""
    prompt_template = feature_config["prompt"]
    # Skip few-shot examples for faster inference
    return prompt_template.replace("{description}", description[:200])


async def extract_one(
    session: aiohttp.ClientSession,
    permit_num: str,
    description: str,
    feature_config: dict,
    pipeline_config: dict,
    semaphore: asyncio.Semaphore
) -> dict:
    """Extract features from one permit."""
    prompt = build_prompt(description, feature_config)
    endpoint = pipeline_config["llm"]["endpoint"]
    model = pipeline_config["llm"]["model"]

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "num_predict": MAX_TOKENS,
            "temperature": pipeline_config["llm"].get("temperature", 0.1)
        }
    }

    feature_names = [f["name"] for f in feature_config["features"]]

    async with semaphore:
        try:
            async with session.post(endpoint, json=payload, timeout=aiohttp.ClientTimeout(total=30)) as resp:
                data = await resp.json()
                response_text = data.get("response", "")

                # Extract JSON from response
                json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
                if json_match:
                    features = json.loads(json_match.group())
                    return {"permit_num": permit_num, **features}
        except Exception:
            pass

    # Return nulls on failure
    return {"permit_num": permit_num, **{f: None for f in feature_names}}


async def extract_batch(
    permits: list,
    feature_config: dict,
    pipeline_config: dict,
    max_concurrent: int = MAX_CONCURRENT
) -> list:
    """Extract features from a batch of permits concurrently."""
    semaphore = asyncio.Semaphore(max_concurrent)
    connector = aiohttp.TCPConnector(limit=max_concurrent * 2)

    async with aiohttp.ClientSession(connector=connector) as session:
        tasks = [
            extract_one(session, p["permit_num"], p["description"],
                       feature_config, pipeline_config, semaphore)
            for p in permits
        ]

        # Process with progress reporting
        results = []
        start_time = time.time()

        for i, coro in enumerate(asyncio.as_completed(tasks)):
            result = await coro
            results.append(result)

            if (i + 1) % 50 == 0 or i + 1 == len(tasks):
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed
                eta = (len(tasks) - i - 1) / rate if rate > 0 else 0
                print(f"Progress: {i+1}/{len(tasks)} ({100*(i+1)/len(tasks):.1f}%) "
                      f"| Rate: {rate:.1f}/s | ETA: {eta/60:.1f}m")

        return results


def load_and_filter(csv_path: str, keywords: list, columns: list, limit: int = None) -> pd.DataFrame:
    """Load CSV, filter by keywords."""
    print(f"Loading {csv_path}...")

    df = pd.read_csv(csv_path, usecols=columns, low_memory=False)
    print(f"Loaded {len(df):,} rows")

    # Filter nulls
    df = df.dropna(subset=["Description", "Latitude", "Longitude"])
    print(f"After dropping nulls: {len(df):,}")

    # Keyword filter
    pattern = "|".join([re.escape(kw) for kw in keywords])
    mask = df["Description"].str.contains(pattern, case=False, na=False)
    df = df[mask]
    print(f"After keyword filter: {len(df):,}")

    if limit:
        df = df.head(limit)
        print(f"Limited to: {len(df):,}")

    return df


def main():
    parser = argparse.ArgumentParser(description="Parallel Extraction Pipeline")
    parser.add_argument("--limit", type=int, help="Limit permits for testing")
    parser.add_argument("--concurrent", type=int, default=MAX_CONCURRENT, help="Max concurrent requests")
    parser.add_argument("--config", default="config", help="Config directory")
    parser.add_argument("--output", default="output/energy_features.parquet", help="Output file")
    args = parser.parse_args()

    project_root = Path(__file__).parent.parent
    config_dir = project_root / args.config

    print("=" * 60)
    print("PARALLEL EXTRACTION PIPELINE")
    print("=" * 60)

    # Load configs
    pipeline_config, feature_config = load_configs(config_dir)

    group_name = feature_config["feature_group"]["name"]
    print(f"Feature group: {group_name}")
    print(f"Model: {pipeline_config['llm']['model']}")
    print(f"Endpoint: {pipeline_config['llm']['endpoint']}")
    print(f"Max concurrent: {args.concurrent}")

    # Get data path
    csv_path = project_root / pipeline_config["data"]["source"]
    columns = pipeline_config["data"]["columns"]
    keywords = feature_config.get("keywords", [])

    # Load and filter
    df = load_and_filter(str(csv_path), keywords, columns, args.limit)

    if len(df) == 0:
        print("No permits to process!")
        return

    # Prepare for extraction
    permits = [
        {"permit_num": row["Permit Num"], "description": row["Description"]}
        for _, row in df.iterrows()
    ]

    # Extract
    print(f"\nExtracting {len(permits):,} permits...")
    start = time.time()

    results = asyncio.run(extract_batch(permits, feature_config, pipeline_config, args.concurrent))

    elapsed = time.time() - start
    rate = len(results) / elapsed
    print(f"\nExtracted {len(results):,} in {elapsed:.1f}s ({rate:.1f}/sec)")

    # Merge results
    results_df = pd.DataFrame(results)

    # Clean up problematic types (LLM may return lists/dicts/mixed types)
    for col in results_df.columns:
        if col == 'permit_num':
            continue
        # Convert any non-scalar types to None, and ensure consistent types
        def clean_value(x):
            if isinstance(x, (list, dict)):
                return None
            if pd.isna(x):
                return None
            return x
        results_df[col] = results_df[col].apply(clean_value)

    final = df.merge(results_df, left_on="Permit Num", right_on="permit_num")

    # Save - use CSV to avoid type conversion issues
    output_path = project_root / args.output
    output_path.parent.mkdir(exist_ok=True)
    if str(output_path).endswith('.parquet'):
        # Try parquet, fall back to CSV
        try:
            final.to_parquet(output_path, index=False)
        except Exception as e:
            csv_path = str(output_path).replace('.parquet', '.csv')
            final.to_csv(csv_path, index=False)
            print(f"Parquet failed ({e}), saved to {csv_path}")
            output_path = csv_path
    else:
        final.to_csv(output_path, index=False)
    print(f"Saved to {output_path}")

    # Summary
    print(f"\n=== Summary ===")
    feature_names = [f["name"] for f in feature_config["features"]]
    for col in feature_names:
        if col in final.columns:
            if final[col].dtype == bool:
                count = final[col].sum()
            else:
                count = final[col].notna().sum()
            print(f"{col}: {count}")


if __name__ == "__main__":
    main()
