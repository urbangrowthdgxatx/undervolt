"""
LLM-based feature extraction using vLLM

This module uses a local LLM (e.g., Llama-3-8B) via vLLM to extract
structured features from permit descriptions.

Requires:
- vLLM installed
- Local LLM model (8B recommended)
- GPU with sufficient VRAM
"""

import logging
import json
from typing import List, Dict, Any
import pandas as pd

log = logging.getLogger("permits")

# Try importing vLLM
VLLM_AVAILABLE = False
try:
    from vllm import LLM, SamplingParams
    VLLM_AVAILABLE = True
except ImportError:
    log.warning("vLLM not installed - LLM extraction unavailable")


# Extraction prompt template
EXTRACTION_PROMPT = """Extract infrastructure signals from this construction permit description.

Description: {description}

Return a JSON object with these boolean flags:
{{
  "is_solar": true/false,
  "is_battery": true/false,
  "is_generator": true/false,
  "is_ev_charger": true/false,
  "is_adu": true/false,
  "is_residential": true/false,
  "is_commercial": true/false,
  "is_new_construction": true/false,
  "is_remodel": true/false,
  "has_hvac": true/false,
  "has_electrical": true/false,
  "has_plumbing": true/false
}}

JSON:"""


class LLMExtractor:
    """Extract features using a local LLM via vLLM"""

    def __init__(
        self,
        model_name: str = "meta-llama/Llama-3-8B-Instruct",
        tensor_parallel_size: int = 1,
        max_model_len: int = 512,
    ):
        """
        Initialize LLM extractor

        Args:
            model_name: HuggingFace model name or local path
            tensor_parallel_size: Number of GPUs for tensor parallelism
            max_model_len: Maximum sequence length
        """
        if not VLLM_AVAILABLE:
            raise ImportError("vLLM not installed. Install with: pip install vllm")

        log.info(f"Loading LLM: {model_name}")
        self.llm = LLM(
            model=model_name,
            tensor_parallel_size=tensor_parallel_size,
            max_model_len=max_model_len,
            gpu_memory_utilization=0.9,
        )

        self.sampling_params = SamplingParams(
            temperature=0.0,  # Deterministic
            max_tokens=256,
            stop=["}\n", "}\r"],  # Stop at JSON end
        )

        log.info("LLM loaded successfully")

    def extract_batch(
        self, descriptions: List[str], batch_size: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Extract features from a batch of descriptions

        Args:
            descriptions: List of permit descriptions
            batch_size: Batch size for inference

        Returns:
            List of extracted feature dictionaries
        """
        # Create prompts
        prompts = [
            EXTRACTION_PROMPT.format(description=desc[:500])  # Truncate long descriptions
            for desc in descriptions
        ]

        log.info(f"Processing {len(prompts)} descriptions in batches of {batch_size}")

        # Run inference
        all_results = []
        for i in range(0, len(prompts), batch_size):
            batch_prompts = prompts[i : i + batch_size]

            outputs = self.llm.generate(batch_prompts, self.sampling_params)

            # Parse outputs
            for output in outputs:
                try:
                    # Extract JSON from output
                    text = output.outputs[0].text.strip()

                    # Handle incomplete JSON
                    if not text.endswith("}"):
                        text += "}"

                    # Parse JSON
                    features = json.loads(text)
                    all_results.append(features)

                except json.JSONDecodeError as e:
                    log.warning(f"Failed to parse JSON: {e}")
                    # Return default (all False)
                    all_results.append({
                        "is_solar": False,
                        "is_battery": False,
                        "is_generator": False,
                        "is_ev_charger": False,
                        "is_adu": False,
                        "is_residential": False,
                        "is_commercial": False,
                        "is_new_construction": False,
                        "is_remodel": False,
                        "has_hvac": False,
                        "has_electrical": False,
                        "has_plumbing": False,
                    })

            if (i + batch_size) % 500 == 0:
                log.info(f"Processed {min(i + batch_size, len(prompts))}/{len(prompts)}")

        return all_results


def llm_enrich(
    df,
    text_col: str = "description",
    model_name: str = "meta-llama/Llama-3-8B-Instruct",
    batch_size: int = 50,
):
    """
    Enrich DataFrame with LLM-extracted features

    Args:
        df: DataFrame with permit data
        text_col: Column containing text to extract from
        model_name: LLM model to use
        batch_size: Batch size for inference

    Returns:
        DataFrame with added LLM feature columns (llm_*)
    """
    if not VLLM_AVAILABLE:
        log.error("vLLM not available - skipping LLM extraction")
        return df

    log.info("🤖 Running LLM-based feature extraction...")

    # Initialize extractor
    extractor = LLMExtractor(model_name=model_name)

    # Get descriptions
    descriptions = df[text_col].fillna("").tolist()

    # Extract features
    features = extractor.extract_batch(descriptions, batch_size=batch_size)

    # Add to DataFrame
    feature_df = pd.DataFrame(features)

    # Rename columns with llm_ prefix
    feature_df.columns = ["llm_" + col for col in feature_df.columns]

    # Concatenate
    result_df = pd.concat([df, feature_df], axis=1)

    log.info("LLM enrichment complete.")
    return result_df


def compare_keyword_vs_llm(df, keyword_prefix="f_", llm_prefix="llm_"):
    """
    Compare keyword extraction vs LLM extraction

    Args:
        df: DataFrame with both keyword and LLM features

    Returns:
        Comparison DataFrame
    """
    comparisons = []

    # Map keyword columns to LLM columns
    mappings = {
        "f_description_kw_solar": "llm_is_solar",
        "f_description_kw_residential": "llm_is_residential",
        "f_description_kw_commercial": "llm_is_commercial",
        "f_description_kw_new": "llm_is_new_construction",
        "f_description_kw_remodel": "llm_is_remodel",
        "f_description_kw_hvac": "llm_has_hvac",
        "f_description_kw_electrical": "llm_has_electrical",
        "f_description_kw_plumbing": "llm_has_plumbing",
    }

    for kw_col, llm_col in mappings.items():
        if kw_col in df.columns and llm_col in df.columns:
            kw_count = df[kw_col].sum()
            llm_count = df[llm_col].sum()
            agreement = (df[kw_col] == df[llm_col]).sum()

            comparisons.append({
                "feature": kw_col.replace("f_description_kw_", ""),
                "keyword_count": kw_count,
                "llm_count": llm_count,
                "agreement": agreement,
                "agreement_pct": (agreement / len(df)) * 100,
            })

    return pd.DataFrame(comparisons)
