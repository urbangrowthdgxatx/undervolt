#!/usr/bin/env python3
"""
Undervolt Extraction Pipeline

Usage:
    python scripts/extract.py                    # Full extraction
    python scripts/extract.py --limit 100        # Test on 100 permits
    python scripts/extract.py --features energy  # Specific feature group
    python scripts/extract.py --dry-run          # Show counts without extraction
"""

import argparse
import json
import re
import sys
import time
from pathlib import Path
from typing import Optional

import requests
import yaml

# Try GPU-accelerated cuDF, fallback to pandas
try:
    import cudf as pd
    print("Using cuDF (GPU-accelerated)")
    USING_GPU = True
except ImportError:
    import pandas as pd
    print("Using pandas (CPU)")
    USING_GPU = False


def load_config(config_dir: Path) -> dict:
    """Load pipeline config."""
    with open(config_dir / "pipeline.yaml") as f:
        return yaml.safe_load(f)


def load_feature_configs(config_dir: Path, feature_names: Optional[list] = None) -> list:
    """Load feature group configs from YAML files."""
    features_dir = config_dir / "features"
    configs = []

    for yaml_file in features_dir.glob("*.yaml"):
        with open(yaml_file) as f:
            config = yaml.safe_load(f)

        # Filter by name if specified
        if feature_names and config["feature_group"]["name"] not in feature_names:
            continue

        if config["feature_group"].get("enabled", True):
            configs.append(config)

    return configs


def load_and_clean_data(config: dict, project_root: Path) -> "pd.DataFrame":
    """
    Stage 1: Load CSV and clean data.

    - Select only needed columns
    - Filter null/empty descriptions
    - Apply minimum length filter
    """
    source_path = project_root / config["data"]["source"]
    columns = config["data"]["columns"]
    cleaning = config["data"].get("cleaning", {})

    print(f"\n=== Stage 1: Loading & Cleaning ===")
    print(f"Source: {source_path}")

    # Load only needed columns
    start = time.time()
    if USING_GPU:
        df = pd.read_csv(source_path, usecols=columns)
    else:
        df = pd.read_csv(source_path, usecols=columns, low_memory=False)
    load_time = time.time() - start

    print(f"Loaded {len(df):,} rows in {load_time:.1f}s")

    # Clean: filter null descriptions
    df = df.dropna(subset=["Description"])
    print(f"After dropping null descriptions: {len(df):,}")

    # Clean: minimum description length
    min_len = cleaning.get("min_description_length", 10)
    if USING_GPU:
        df = df[df["Description"].str.len() >= min_len]
    else:
        df = df[df["Description"].str.len() >= min_len]
    print(f"After min length filter ({min_len}): {len(df):,}")

    return df


def filter_by_keywords(df: "pd.DataFrame", keywords: list) -> "pd.DataFrame":
    """
    Stage 2: Pre-filter permits by keywords.

    This dramatically reduces the dataset before LLM extraction.
    Only permits containing at least one keyword are kept.
    """
    print(f"\n=== Stage 2: Keyword Filtering ===")
    print(f"Keywords: {keywords[:5]}... ({len(keywords)} total)")

    # Build regex pattern - make case-insensitive inline for cuDF compatibility
    # Convert keywords to match both cases where needed
    pattern_parts = []
    for kw in keywords:
        # For word boundary patterns, handle case-insensitivity manually
        if kw.startswith("\\b"):
            # Already has word boundary, make it case-insensitive with (?i)
            pattern_parts.append(f"(?i){kw}")
        else:
            pattern_parts.append(f"(?i){re.escape(kw)}")
    pattern = "|".join(pattern_parts)

    start = time.time()
    if USING_GPU:
        # cuDF: use regex=True without case parameter, use (?i) in pattern instead
        mask = df["Description"].str.contains(pattern, regex=True)
    else:
        mask = df["Description"].str.contains(pattern, case=False, regex=True, na=False)

    filtered = df[mask].copy()
    filter_time = time.time() - start

    print(f"Filtered to {len(filtered):,} permits in {filter_time:.1f}s")
    print(f"Reduction: {len(df):,} → {len(filtered):,} ({100*len(filtered)/len(df):.1f}%)")

    return filtered


def build_prompt(description: str, feature_config: dict) -> str:
    """Build LLM prompt from feature config."""
    prompt_template = feature_config["prompt"]

    # Add few-shot examples if available
    examples = feature_config.get("examples", [])
    if examples:
        example_text = "\n\nExamples:\n"
        for ex in examples[:2]:  # Use up to 2 examples
            example_text += f"Input: {ex['input']}\nOutput: {ex['output']}\n\n"
        prompt_template = example_text + prompt_template

    # Use replace instead of format to avoid issues with JSON braces
    return prompt_template.replace("{description}", description)


def call_llm(prompt: str, config: dict) -> Optional[dict]:
    """Call Ollama API and parse JSON response."""
    endpoint = config["llm"]["endpoint"]
    model = config["llm"]["model"]

    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": config["llm"].get("temperature", 0.1),
            "num_predict": config["llm"].get("max_tokens", 256)
        }
    }

    try:
        resp = requests.post(endpoint, json=payload, timeout=60)
        resp.raise_for_status()

        response_text = resp.json().get("response", "")

        # Extract JSON from response
        # Try to find JSON object in response
        json_match = re.search(r'\{[^{}]*\}', response_text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())

        return None

    except Exception as e:
        print(f"LLM error: {e}")
        return None


def extract_features(
    df: "pd.DataFrame",
    feature_config: dict,
    pipeline_config: dict,
    limit: Optional[int] = None
) -> "pd.DataFrame":
    """
    Stage 3: LLM Feature Extraction.

    For each permit, call the LLM and extract structured features.
    """
    print(f"\n=== Stage 3: LLM Extraction ===")
    print(f"Model: {pipeline_config['llm']['model']}")
    print(f"Endpoint: {pipeline_config['llm']['endpoint']}")

    # Apply limit if specified
    if limit:
        df = df.head(limit)
        print(f"Limited to {limit} permits for testing")

    # Get feature names for result columns
    feature_names = [f["name"] for f in feature_config["features"]]

    # Initialize result columns
    results = []

    total = len(df)
    start_time = time.time()

    # Convert to pandas for iteration if using cuDF
    if USING_GPU:
        df_iter = df.to_pandas()
    else:
        df_iter = df

    for idx, row in enumerate(df_iter.iterrows()):
        i, data = row
        description = data["Description"]

        # Build prompt and call LLM
        prompt = build_prompt(description, feature_config)
        extracted = call_llm(prompt, pipeline_config)

        if extracted:
            results.append({
                "permit_num": data["Permit Num"],
                **extracted
            })
        else:
            # Failed extraction - use null values
            results.append({
                "permit_num": data["Permit Num"],
                **{f: None for f in feature_names}
            })

        # Progress
        if (idx + 1) % 10 == 0:
            elapsed = time.time() - start_time
            rate = (idx + 1) / elapsed
            eta = (total - idx - 1) / rate if rate > 0 else 0
            print(f"Progress: {idx+1}/{total} ({100*(idx+1)/total:.1f}%) "
                  f"| Rate: {rate:.1f}/s | ETA: {eta:.0f}s")

    # Create results dataframe
    results_df = pd.DataFrame(results) if not USING_GPU else pd.DataFrame.from_pandas(
        __import__('pandas').DataFrame(results)
    )

    # Merge with original data
    if USING_GPU:
        df_pandas = df.to_pandas()
        results_pandas = results_df.to_pandas() if USING_GPU else results_df
        merged = df_pandas.merge(results_pandas, left_on="Permit Num", right_on="permit_num")
        final = pd.DataFrame.from_pandas(merged)
    else:
        final = df.merge(results_df, left_on="Permit Num", right_on="permit_num")

    elapsed = time.time() - start_time
    print(f"\nExtracted {len(results)} permits in {elapsed:.1f}s ({len(results)/elapsed:.2f}/s)")

    return final


def save_results(df: "pd.DataFrame", config: dict, feature_name: str, project_root: Path):
    """Stage 4: Save results to output directory."""
    output_dir = project_root / config["output"]["dir"]
    output_dir.mkdir(exist_ok=True)

    output_format = config["output"].get("format", "parquet")
    output_path = output_dir / f"{feature_name}_features.{output_format}"

    print(f"\n=== Stage 4: Saving Results ===")
    print(f"Output: {output_path}")

    if output_format == "parquet":
        if USING_GPU:
            df.to_parquet(output_path)
        else:
            df.to_parquet(output_path, index=False)
    else:
        if USING_GPU:
            df.to_csv(output_path, index=False)
        else:
            df.to_csv(output_path, index=False)

    print(f"Saved {len(df):,} rows")


def main():
    parser = argparse.ArgumentParser(description="Undervolt Extraction Pipeline")
    parser.add_argument("--limit", type=int, help="Limit permits for testing")
    parser.add_argument("--features", nargs="+", help="Specific feature groups to extract")
    parser.add_argument("--dry-run", action="store_true", help="Show counts without extraction")
    parser.add_argument("--config", default="config", help="Config directory")
    args = parser.parse_args()

    # Paths
    project_root = Path(__file__).parent.parent
    config_dir = project_root / args.config

    # Load configs
    print("=" * 60)
    print("UNDERVOLT EXTRACTION PIPELINE")
    print("=" * 60)

    pipeline_config = load_config(config_dir)
    feature_configs = load_feature_configs(config_dir, args.features)

    if not feature_configs:
        print("No feature configs found!")
        sys.exit(1)

    print(f"Feature groups: {[c['feature_group']['name'] for c in feature_configs]}")

    # Stage 1: Load and clean
    df = load_and_clean_data(pipeline_config, project_root)

    # Process each feature group
    for feature_config in feature_configs:
        group_name = feature_config["feature_group"]["name"]
        print(f"\n{'='*60}")
        print(f"Processing: {group_name}")
        print("=" * 60)

        # Stage 2: Filter by keywords
        keywords = feature_config.get("keywords", [])
        if keywords:
            filtered_df = filter_by_keywords(df, keywords)
        else:
            filtered_df = df

        if args.dry_run:
            print(f"\n[DRY RUN] Would extract {len(filtered_df):,} permits")
            continue

        # Stage 3: Extract features
        limit = args.limit or pipeline_config["extraction"].get("limit")
        results_df = extract_features(filtered_df, feature_config, pipeline_config, limit)

        # Stage 4: Save
        save_results(results_df, pipeline_config, group_name, project_root)

    print("\n" + "=" * 60)
    print("PIPELINE COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
