#!/bin/bash
# Undervolt Model Eval Runner
#
# Usage:
#   bash eval/run-eval.sh                    # run full eval + push to Supabase
#   bash eval/run-eval.sh --view             # just open the results viewer
#   bash eval/run-eval.sh --no-push          # run eval without Supabase push
#
# Env vars (auto-loaded from .env.local):
#   VLLM_BASE_URL    — LiteLLM gateway URL
#   LLM_API_KEY      — API key for LiteLLM
#   NEXT_PUBLIC_SUPABASE_URL — for pushing results

set -e
cd "$(dirname "$0")/.."

# Load env
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

if [ "$1" = "--view" ]; then
  echo "Opening eval results viewer..."
  npx promptfoo view -c eval/promptfooconfig.yaml
  exit 0
fi

echo "╔══════════════════════════════════════╗"
echo "║  Undervolt Model Eval Suite          ║"
echo "║  96 questions × N models             ║"
echo "╚══════════════════════════════════════╝"
echo ""
echo "Gateway: ${VLLM_BASE_URL:-http://100.117.118.119:4000/v1}"
echo ""

# Run promptfoo eval
echo "Running eval..."
npx promptfoo eval \
  -c eval/promptfooconfig.yaml \
  -o eval/results/latest.json \
  --no-cache \
  --verbose

echo ""
echo "Eval complete. Results: eval/results/latest.json"

# Generate HTML report
npx promptfoo eval \
  -c eval/promptfooconfig.yaml \
  -o eval/results/latest.html \
  --no-cache \
  --share 2>/dev/null || true

# Push to Supabase unless --no-push
if [ "$1" != "--no-push" ]; then
  echo ""
  echo "Pushing results to Supabase..."
  npx tsx eval/scripts/push-to-supabase.ts eval/results/latest.json
fi

echo ""
echo "Done! View results:"
echo "  npx promptfoo view -c eval/promptfooconfig.yaml"
echo "  open eval/results/latest.html"
