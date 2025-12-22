"""Main pipeline entry point"""
import os
import sys
import logging

# Import configuration and modules
from .config import DATA_PATH, TEXT_COLUMNS, OUTPUT_ENRICHED, OUTPUT_SUMMARY
from .utils import setup_logging, print_gpu_info
from .data import load_data, clean_permit_data, save_results
from .nlp import nlp_enrich
from .clustering import run_cuml_clustering

# Try importing Jetson LLM support (optional)
LLM_EXTRACTOR = None
try:
    from .nlp.llm_jetson import JetsonLLMExtractor
    JETSON_LLM_AVAILABLE = True
except ImportError:
    JETSON_LLM_AVAILABLE = False

# Setup logging
log = setup_logging()


def main():
    """
    Main pipeline execution

    Steps:
    1. Check data file exists
    2. Print GPU info
    3. Load data
    4. Clean data
    5. NLP enrichment
    6. Clustering
    7. Save results
    """
    # Check if data file exists
    if not os.path.exists(DATA_PATH):
        log.error(f"Data file not found: {DATA_PATH}")
        log.error("Download from: https://data.austintexas.gov/Building-and-Development/Issued-Construction-Permits/3syk-w9eu")
        log.error("Run: bash scripts/download_data.sh")
        return 1

    # Print GPU environment info
    print_gpu_info()

    # Load data
    df = load_data(DATA_PATH)

    # Clean data
    clean_df = clean_permit_data(df)

    # NLP enrichment (keyword-based)
    nlp_enriched_df = nlp_enrich(clean_df, TEXT_COLUMNS)

    # LLM extraction (optional, energy infrastructure signals)
    try:
        from . import config
        if hasattr(config, 'LLM_ENABLED') and config.LLM_ENABLED and JETSON_LLM_AVAILABLE:
            log.info(f"🤖 Using {config.LLM_BACKEND} for LLM extraction...")
            extractor = JetsonLLMExtractor(
                backend=config.LLM_BACKEND,
                model=config.LLM_MODEL
            )
            nlp_enriched_df = extractor.extract_dataframe(
                nlp_enriched_df,
                text_col="description"
            )
            log.info("✅ LLM extraction complete - added energy infrastructure features")
        else:
            log.info("⏭️  LLM extraction disabled (configure LLM_ENABLED=True to enable)")
    except Exception as e:
        log.warning(f"⚠️  LLM extraction skipped: {e}")

    # Save enriched dataset
    nlp_enriched_df.to_csv(OUTPUT_ENRICHED, index=False)
    log.info(f"Saved enriched dataset with NLP features → {OUTPUT_ENRICHED}")

    # Clustering
    cuml_enriched_df = run_cuml_clustering(nlp_enriched_df)

    # Save final results
    save_results(cuml_enriched_df, OUTPUT_SUMMARY)

    log.info("✅ Pipeline complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
