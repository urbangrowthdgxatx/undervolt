#!/usr/bin/env python3
"""
Example: Using LLM extraction on Jetson

This script demonstrates how to use the Jetson-optimized LLM extraction.

Prerequisites:
    - For Ollama backend: ollama serve (running in background)
    - For vLLM backend: pip install vllm
"""

import logging
from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor
from src.pipeline.nlp.jetson_setup import (
    print_jetson_setup_guide,
    check_ollama_running,
    recommend_backend_for_jetson,
)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger(__name__)


def main():
    # Print setup guide
    print_jetson_setup_guide()

    # Recommend backend based on available VRAM
    recommended = recommend_backend_for_jetson()
    print(f"\n💡 Recommended backend for your Jetson: {recommended}")

    # Check if Ollama is available (if using Ollama)
    if recommended == "ollama":
        if check_ollama_running():
            print("✓ Ollama is running")
        else:
            print(
                "✗ Ollama is not running\n"
                "Start it with: ollama serve"
            )
            return

    # Initialize extractor
    print(f"\n🔧 Initializing {recommended} backend...")
    extractor = JetsonLLMExtractor(backend=recommended)

    # Example descriptions to extract from
    sample_descriptions = [
        "New residential solar installation with battery storage and EV charger",
        "Commercial HVAC system replacement and electrical panel upgrade",
        "ADU addition with full plumbing and electrical infrastructure",
        "Residential remodel: kitchen, bathroom, and solar roofing",
        "Generator installation for emergency backup power",
    ]

    # Extract features
    print("\n🚀 Extracting features from sample descriptions...")
    features = extractor.extract_batch(sample_descriptions)

    # Display results
    print("\n📊 Extraction Results:")
    print("=" * 60)
    for i, (desc, feat) in enumerate(zip(sample_descriptions, features)):
        print(f"\n{i+1}. {desc[:60]}...")
        print(f"   Features: {feat}")

    # Demonstrate DataFrame extraction
    print("\n\n📈 Extracting from DataFrame:")
    import pandas as pd

    df = pd.DataFrame({
        "id": range(1, 6),
        "description": sample_descriptions,
    })

    print("Input DataFrame:")
    print(df[["id", "description"]])

    df_enriched = extractor.extract_dataframe(df, text_col="description")
    
    print("\nEnriched DataFrame (showing extracted features):")
    feature_cols = [col for col in df_enriched.columns if col.startswith("f_")]
    print(df_enriched[["id"] + feature_cols].head())


if __name__ == "__main__":
    main()
