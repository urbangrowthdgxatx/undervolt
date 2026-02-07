/**
 * LLM Client Configuration
 *
 * Supports multiple backends:
 * - OpenAI API (default)
 * - Local vLLM server (OpenAI-compatible)
 * - Ollama server
 * - Analytics-only mode (no LLM)
 */

import { createOpenAI } from '@ai-sdk/openai';

export function getLLMClient() {
  // Check for local vLLM server
  const vllmUrl = process.env.VLLM_BASE_URL || process.env.LOCAL_LLM_URL;

  if (vllmUrl) {
    // Use local vLLM with OpenAI-compatible API
    const customOpenAI = createOpenAI({
      baseURL: vllmUrl,
      apiKey: process.env.VLLM_API_KEY || 'dummy-key' // vLLM doesn't require real API key
    });
    return customOpenAI;
  }

  // Fallback to OpenAI API
  if (process.env.OPENAI_API_KEY) {
    return createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  // No LLM available
  throw new Error('No LLM configured. Set OPENAI_API_KEY or VLLM_BASE_URL');
}

export function getModelName(): string {
  // For local vLLM, use the model name from environment or a default
  if (process.env.VLLM_BASE_URL || process.env.LOCAL_LLM_URL) {
    return process.env.VLLM_MODEL_NAME || 'meta-llama/Llama-3.2-3B-Instruct';
  }

  // For OpenAI
  return process.env.OPENAI_MODEL || 'gpt-4o';
}

export function isLLMAvailable(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.VLLM_BASE_URL || process.env.LOCAL_LLM_URL);
}
