#!/bin/bash
# Q&A Validation Workflow
# Run this after adding/changing questions in src/lib/modes.ts
#
# Usage:
#   ./scripts/validate-qa.sh          # Full workflow: build + cache + telegram
#   ./scripts/validate-qa.sh cache    # Cache only (skip build)
#   ./scripts/validate-qa.sh telegram # Telegram only (skip build + cache)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$FRONTEND_DIR")"

export PATH="/home/red/.nvm/versions/node/v24.12.0/bin:/usr/bin:/bin:$PATH"

cd "$FRONTEND_DIR"

# Load env vars
set -a
source .env.local
source "$PROJECT_DIR/.env"
set +a

MODE="${1:-all}"

# Step 1: Build
if [ "$MODE" = "all" ]; then
  echo "=== Step 1: Building to verify modes.ts changes ==="
  npm run build
  echo ""
fi

# Step 2: Cache answers via Nemotron
if [ "$MODE" = "all" ] || [ "$MODE" = "cache" ]; then
  echo "=== Step 2: Caching answers via Nemotron (nemotron-mini) ==="
  npx tsx scripts/cache-mode-questions.ts
  echo ""
fi

# Step 3: Send to Telegram for review
if [ "$MODE" = "all" ] || [ "$MODE" = "telegram" ]; then
  echo "=== Step 3: Sending Q&A to Telegram for review ==="
  npx tsx scripts/send-qa-telegram.ts
  echo ""
fi

echo "=== Done! Check Telegram for review ==="
