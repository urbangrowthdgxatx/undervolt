"""
Jetson-optimized LLM extraction using lightweight backends

Supports multiple backends optimized for Jetson's limited VRAM:
1. Ollama (simplest, recommended for Jetson)
2. vLLM with quantized models (8-bit, 4-bit)
3. llama.cpp (lightweight C++ backend)

Usage:
    from src.pipeline.nlp.llm_jetson import JetsonLLMExtractor
    
    extractor = JetsonLLMExtractor(backend="ollama", model="mistral-7b")
    features = extractor.extract_batch(descriptions)
"""

import logging
import json
from typing import List, Dict, Any, Optional
import requests
import pandas as pd

log = logging.getLogger("permits")

# Try importing vLLM
VLLM_AVAILABLE = False
try:
    from vllm import LLM, SamplingParams
    VLLM_AVAILABLE = True
except ImportError:
    pass


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

Return only valid JSON."""


class OllamaExtractor:
    """Extract features using Ollama (recommended for Jetson)"""

    def __init__(
        self,
        model_name: str = "mistral-7b",
        base_url: str = "http://localhost:11434",
        timeout: int = 60,
    ):
        """
        Initialize Ollama extractor

        Args:
            model_name: Ollama model name (e.g., 'mistral-7b', 'neural-chat')
            base_url: Ollama server URL
            timeout: Request timeout in seconds
        """
        self.model_name = model_name
        self.base_url = base_url
        self.timeout = timeout

        # Test connection
        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=5,
            )
            log.info(f"✓ Connected to Ollama at {self.base_url}")
        except requests.ConnectionError:
            log.error(
                f"✗ Cannot connect to Ollama at {self.base_url}\n"
                f"Start Ollama with: ollama serve\n"
                f"Then pull model: ollama pull {model_name}"
            )
            raise

        # Pull model if not present
        self._ensure_model_pulled()

    def _ensure_model_pulled(self):
        """Ensure model is downloaded"""
        try:
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": self.model_name},
                timeout=600,  # Model pull can take time
                stream=True,
            )
            if response.status_code == 200:
                log.info(f"✓ Model {self.model_name} ready")
        except Exception as e:
            log.warning(f"Could not pull model: {e}")

    def extract_batch(
        self, descriptions: List[str], batch_size: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Extract features from a batch of descriptions

        Args:
            descriptions: List of permit descriptions
            batch_size: Batch size (Ollama processes one at a time anyway)

        Returns:
            List of extracted feature dictionaries
        """
        results = []
        log.info(f"Extracting features from {len(descriptions)} descriptions using Ollama")

        for i, desc in enumerate(descriptions):
            if i % 10 == 0:
                log.info(f"  Progress: {i}/{len(descriptions)}")

            try:
                prompt = EXTRACTION_PROMPT.format(description=desc[:500])

                response = requests.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model_name,
                        "prompt": prompt,
                        "stream": False,
                        "temperature": 0.0,
                    },
                    timeout=self.timeout,
                )

                if response.status_code == 200:
                    output = response.json()["response"]
                    # Extract JSON from response
                    features = self._parse_json_response(output)
                    results.append(features)
                else:
                    log.warning(f"Ollama error: {response.status_code}")
                    results.append({})

            except Exception as e:
                log.warning(f"Error processing description {i}: {e}")
                results.append({})

        log.info(f"Extraction complete: {len(results)} features extracted")
        return results

    @staticmethod
    def _parse_json_response(response_text: str) -> Dict[str, Any]:
        """Extract JSON from LLM response"""
        try:
            # Try to find JSON in response
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = response_text[start:end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        return {}


class VLLMQuantizedExtractor:
    """Extract features using vLLM with quantized models (8-bit, 4-bit)"""

    def __init__(
        self,
        model_name: str = "TheBloke/Mistral-7B-Instruct-GGUF",
        quantization: str = "awq",  # 'awq', 'gptq', 'bitsandbytes'
        max_model_len: int = 1024,
    ):
        """
        Initialize quantized vLLM extractor

        Args:
            model_name: HuggingFace model (preferably quantized)
            quantization: Quantization method
            max_model_len: Maximum sequence length
        """
        if not VLLM_AVAILABLE:
            raise ImportError("vLLM not installed. Install with: pip install vllm")

        log.info(f"Loading quantized LLM: {model_name} ({quantization})")
        self.llm = LLM(
            model=model_name,
            quantization=quantization,
            max_model_len=max_model_len,
            gpu_memory_utilization=0.85,  # Conservative for Jetson
            dtype="auto",  # Use appropriate dtype for quantization
        )

        self.sampling_params = SamplingParams(
            temperature=0.0,
            max_tokens=256,
            stop=["}\n", "}\r"],
        )

    def extract_batch(
        self, descriptions: List[str], batch_size: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Extract features from a batch of descriptions

        Args:
            descriptions: List of permit descriptions
            batch_size: Batch size (smaller for Jetson memory)

        Returns:
            List of extracted feature dictionaries
        """
        results = []
        log.info(
            f"Extracting features from {len(descriptions)} descriptions using vLLM"
        )

        # Process in batches
        for i in range(0, len(descriptions), batch_size):
            batch = descriptions[i : i + batch_size]
            prompts = [
                EXTRACTION_PROMPT.format(description=desc[:500]) for desc in batch
            ]

            try:
                outputs = self.llm.generate(prompts, self.sampling_params)
                for output in outputs:
                    text = output.outputs[0].text
                    features = self._parse_json_response(text)
                    results.append(features)
            except Exception as e:
                log.warning(f"Error processing batch {i//batch_size}: {e}")
                results.extend([{} for _ in batch])

            if i % (batch_size * 10) == 0:
                log.info(f"  Progress: {min(i + batch_size, len(descriptions))}/{len(descriptions)}")

        log.info(f"Extraction complete: {len(results)} features extracted")
        return results

    @staticmethod
    def _parse_json_response(response_text: str) -> Dict[str, Any]:
        """Extract JSON from LLM response"""
        try:
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = response_text[start:end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        return {}


class JetsonLLMExtractor:
    """Unified interface for Jetson LLM extraction"""

    def __init__(
        self,
        backend: str = "ollama",
        model: Optional[str] = None,
        **kwargs,
    ):
        """
        Initialize Jetson LLM extractor

        Args:
            backend: 'ollama' (recommended), 'vllm-quantized', or 'vllm'
            model: Model name (backend-specific)
            **kwargs: Additional backend-specific arguments
        """
        self.backend = backend

        if backend == "ollama":
            model = model or "mistral-7b"
            self.extractor = OllamaExtractor(model_name=model, **kwargs)
        elif backend == "vllm-quantized":
            model = model or "TheBloke/Mistral-7B-Instruct-GPTQ"
            self.extractor = VLLMQuantizedExtractor(model_name=model, **kwargs)
        elif backend == "vllm":
            if not VLLM_AVAILABLE:
                raise ImportError("vLLM not available")
            from .llm_extraction import LLMExtractor
            self.extractor = LLMExtractor(model_name=model or "meta-llama/Llama-3-8B-Instruct", **kwargs)
        else:
            raise ValueError(f"Unknown backend: {backend}")

        log.info(f"✓ Jetson LLM Extractor initialized ({backend})")

    def extract_batch(self, descriptions: List[str], **kwargs) -> List[Dict[str, Any]]:
        """Extract features from descriptions"""
        return self.extractor.extract_batch(descriptions, **kwargs)

    def extract_dataframe(
        self, df: pd.DataFrame, text_col: str = "description"
    ) -> pd.DataFrame:
        """
        Extract features from a DataFrame column

        Args:
            df: Input DataFrame
            text_col: Column name with descriptions

        Returns:
            DataFrame with extracted features as columns
        """
        if text_col not in df.columns:
            log.warning(f"Column {text_col} not found")
            return df

        descriptions = df[text_col].fillna("").astype(str).tolist()
        features_list = self.extract_batch(descriptions)

        # Convert list of dicts to DataFrame
        features_df = pd.DataFrame(features_list)

        # Add to original DataFrame
        for col in features_df.columns:
            df[f"f_{col}"] = features_df[col].fillna(False).astype(int)

        return df
