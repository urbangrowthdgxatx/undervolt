"""
LLM-based Permit Categorization

Uses local LLM (Ollama/vLLM) to analyze permit descriptions and generate
semantic categories beyond simple keyword matching.

Integrates with the unified pipeline architecture.
"""

import logging
import json
import time
from typing import Optional, Dict, List, Any
from dataclasses import dataclass
from collections import defaultdict

# Try importing requests - fall back gracefully
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

from ..platform import get_config

log = logging.getLogger(__name__)


@dataclass
class LLMConfig:
    """LLM configuration"""
    base_url: str = "http://localhost:11434/v1"
    model: str = "llama3.2:3b"
    temperature: float = 0.1
    max_tokens: int = 150
    timeout: int = 30
    batch_delay: float = 0.1  # Delay between requests


# Default categories schema
DEFAULT_CATEGORIES = {
    "project_type": [
        "new_construction", "renovation", "repair", "maintenance",
        "upgrade", "demolition", "installation", "inspection"
    ],
    "building_type": [
        "residential_single", "residential_multi", "commercial",
        "industrial", "mixed_use", "infrastructure", "other"
    ],
    "scale": ["minor", "moderate", "major"],
    "trade": [
        "electrical", "plumbing", "hvac", "structural", "roofing",
        "general", "landscaping", "foundation", "mechanical"
    ],
    "is_green": [True, False]
}


CATEGORIZATION_PROMPT = """Analyze this construction permit and categorize it.

Description: "{description}"

Return a JSON object with exactly these fields:
- project_type: one of {project_types}
- building_type: one of {building_types}
- scale: one of {scales}
- trade: one of {trades}
- is_green: true if related to solar/EV/battery/energy efficiency, false otherwise

Return ONLY valid JSON, no explanation or markdown."""


class LLMCategorizer:
    """
    LLM-based permit categorizer.

    Uses local LLM (Ollama/vLLM with OpenAI-compatible API) to semantically
    categorize permit descriptions.
    """

    def __init__(self, config: Optional[LLMConfig] = None):
        """
        Initialize categorizer.

        Args:
            config: LLM configuration. If None, uses defaults from platform config.
        """
        if not REQUESTS_AVAILABLE:
            raise ImportError("requests library required for LLM categorization")

        self.config = config or self._load_config()
        self.categories = DEFAULT_CATEGORIES
        self.stats = {"success": 0, "failed": 0, "total_time": 0}

        log.info(f"🤖 LLM Categorizer initialized")
        log.info(f"   Model: {self.config.model}")
        log.info(f"   URL: {self.config.base_url}")

    def _load_config(self) -> LLMConfig:
        """Load config from platform settings"""
        platform_config = get_config()

        return LLMConfig(
            base_url=getattr(platform_config, 'llm_base_url', "http://localhost:11434/v1"),
            model=getattr(platform_config, 'llm_model', "llama3.2:3b"),
            temperature=0.1,
            max_tokens=150,
            timeout=30
        )

    def _build_prompt(self, description: str) -> str:
        """Build categorization prompt"""
        return CATEGORIZATION_PROMPT.format(
            description=description[:500],  # Limit length
            project_types=self.categories["project_type"],
            building_types=self.categories["building_type"],
            scales=self.categories["scale"],
            trades=self.categories["trade"]
        )

    def _query_llm(self, prompt: str) -> Optional[Dict]:
        """Query LLM with OpenAI-compatible API"""
        try:
            response = requests.post(
                f"{self.config.base_url}/chat/completions",
                json={
                    "model": self.config.model,
                    "messages": [
                        {"role": "system", "content": "You are a construction permit analyzer. Return only valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": self.config.temperature,
                    "max_tokens": self.config.max_tokens,
                },
                timeout=self.config.timeout
            )
            response.raise_for_status()

            result = response.json()
            text = result["choices"][0]["message"]["content"].strip()

            # Clean up response - remove markdown if present
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            return json.loads(text)

        except requests.exceptions.RequestException as e:
            log.warning(f"LLM request error: {e}")
            return None
        except json.JSONDecodeError as e:
            log.warning(f"JSON parse error: {e}")
            return None
        except Exception as e:
            log.warning(f"LLM error: {e}")
            return None

    def categorize_one(self, description: str) -> Optional[Dict]:
        """
        Categorize a single permit description.

        Args:
            description: Permit description text

        Returns:
            Dict with category fields, or None if failed
        """
        if not description or len(description.strip()) < 5:
            return None

        start = time.time()
        prompt = self._build_prompt(description)
        result = self._query_llm(prompt)

        elapsed = time.time() - start
        self.stats["total_time"] += elapsed

        if result:
            self.stats["success"] += 1
            return result
        else:
            self.stats["failed"] += 1
            return None

    def categorize_batch(
        self,
        items: List[tuple],
        id_col: int = 0,
        desc_col: int = 1,
        progress_callback=None
    ) -> Dict[Any, Dict]:
        """
        Categorize a batch of permits.

        Args:
            items: List of tuples with (id, description, ...)
            id_col: Index of ID column in tuple
            desc_col: Index of description column in tuple
            progress_callback: Optional callback(current, total, result)

        Returns:
            Dict mapping ID -> categories
        """
        results = {}
        total = len(items)

        log.info(f"Categorizing {total} permits...")

        for i, item in enumerate(items):
            permit_id = item[id_col]
            description = item[desc_col]

            categories = self.categorize_one(description)

            if categories:
                results[permit_id] = categories

            if progress_callback:
                progress_callback(i + 1, total, categories)
            elif (i + 1) % 10 == 0:
                log.info(f"  Progress: {i+1}/{total} ({len(results)} categorized)")

            # Small delay to not overwhelm LLM
            if self.config.batch_delay > 0:
                time.sleep(self.config.batch_delay)

        log.info(f"✅ Categorized {len(results)}/{total} permits")
        log.info(f"   Success rate: {self.stats['success']/(self.stats['success']+self.stats['failed'])*100:.1f}%")
        log.info(f"   Avg time: {self.stats['total_time']/max(1,self.stats['success']+self.stats['failed']):.2f}s/permit")

        return results

    def get_distribution(self, categories: Dict[Any, Dict]) -> Dict[str, Dict[str, int]]:
        """
        Get distribution of categories.

        Args:
            categories: Dict mapping ID -> category dict

        Returns:
            Dict mapping field -> value -> count
        """
        distributions = defaultdict(lambda: defaultdict(int))

        for cats in categories.values():
            for field, value in cats.items():
                if isinstance(value, bool):
                    value = str(value).lower()
                distributions[field][value] += 1

        return {k: dict(v) for k, v in distributions.items()}


def enrich_dataframe(df, text_column: str = "work_description", config: Optional[LLMConfig] = None):
    """
    Enrich DataFrame with LLM-generated categories.

    This is the main entry point for pipeline integration.

    Args:
        df: DataFrame with permit data
        text_column: Column containing description text
        config: Optional LLM config

    Returns:
        DataFrame with added category columns
    """
    if text_column not in df.columns:
        log.warning(f"Column {text_column} not found, skipping LLM enrichment")
        return df

    categorizer = LLMCategorizer(config)

    # Prepare items for batch processing
    items = [(i, row[text_column]) for i, row in df.iterrows() if row[text_column]]

    # Run categorization
    categories = categorizer.categorize_batch(items)

    # Add columns to DataFrame
    new_cols = ["llm_project_type", "llm_building_type", "llm_scale", "llm_trade", "llm_is_green"]

    for col in new_cols:
        df[col] = None

    for idx, cats in categories.items():
        df.at[idx, "llm_project_type"] = cats.get("project_type")
        df.at[idx, "llm_building_type"] = cats.get("building_type")
        df.at[idx, "llm_scale"] = cats.get("scale")
        df.at[idx, "llm_trade"] = cats.get("trade")
        df.at[idx, "llm_is_green"] = str(cats.get("is_green", False)).lower()

    log.info(f"✅ Added LLM categories to {len(categories)} rows")

    return df


# CLI for standalone usage
if __name__ == "__main__":
    import sqlite3
    import sys

    logging.basicConfig(level=logging.INFO, format="%(message)s")

    DB_PATH = "/home/red/Documents/github/undervolt/data/undervolt.db"
    sample_size = int(sys.argv[1]) if len(sys.argv) > 1 else 50

    print(f"\n{'='*60}")
    print(f" LLM PERMIT CATEGORIZATION ".center(60, '='))
    print(f"{'='*60}")

    # Load sample from database
    conn = sqlite3.connect(DB_PATH)

    query = """
    SELECT id, work_description, energy_type, cluster_id
    FROM permits
    WHERE work_description IS NOT NULL
    AND length(work_description) > 10
    ORDER BY RANDOM()
    LIMIT ?
    """

    rows = conn.execute(query, (sample_size,)).fetchall()
    print(f"\nLoaded {len(rows)} permits")

    # Categorize
    categorizer = LLMCategorizer()
    categories = categorizer.categorize_batch(rows)

    # Show distribution
    distributions = categorizer.get_distribution(categories)

    print(f"\n{'='*60}")
    print(" CATEGORY DISTRIBUTION ".center(60, '='))
    print("="*60)

    for field, counts in sorted(distributions.items()):
        print(f"\n{field.upper()}:")
        for value, count in sorted(counts.items(), key=lambda x: -x[1]):
            pct = (count / len(categories)) * 100
            bar = "█" * int(pct / 5)
            print(f"  {value:20s} {count:4d} ({pct:5.1f}%) {bar}")

    # Save results
    output_path = "/home/red/Documents/github/undervolt/data/llm_categories.json"
    with open(output_path, 'w') as f:
        json.dump({
            "metadata": {
                "sample_size": sample_size,
                "categorized": len(categories),
                "model": categorizer.config.model,
            },
            "distributions": distributions,
            "permits": {str(k): v for k, v in categories.items()}
        }, f, indent=2)

    print(f"\n✅ Saved results to {output_path}")

    conn.close()
