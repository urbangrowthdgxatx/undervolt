#!/bin/bash
# Undervolt Jetson AGX Orin Deployment Script
# Sets up LiteLLM gateway, pulls models, configures systemd services
#
# Usage: bash deploy/setup-jetson.sh
# Run from the undervolt repo root on the Jetson

set -e

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_DIR="${REPO_DIR}/deploy"
FRONTEND_DIR="${REPO_DIR}/frontend"

echo "========================================"
echo "Undervolt — Jetson Deployment"
echo "========================================"
echo "Repo: ${REPO_DIR}"
echo ""

# ─── Step 1: Install LiteLLM ───────────────────────
echo "Step 1: Installing LiteLLM..."
pip install 'litellm[proxy]' --quiet 2>/dev/null || pip3 install 'litellm[proxy]' --quiet
echo "LiteLLM installed."

# ─── Step 2: Generate master key if needed ──────────
ENV_FILE="${DEPLOY_DIR}/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo ""
  echo "Step 2: Generating LiteLLM config..."
  MASTER_KEY="sk-admin-$(python3 -c 'import secrets; print(secrets.token_hex(16))')"

  # Check if NIM key exists in frontend env
  NIM_KEY=""
  if [ -f "${FRONTEND_DIR}/.env.local" ]; then
    NIM_KEY=$(grep NVIDIA_NIM_API_KEY "${FRONTEND_DIR}/.env.local" | cut -d= -f2-)
  fi

  cat > "$ENV_FILE" << EOF
LITELLM_MASTER_KEY=${MASTER_KEY}
NVIDIA_NIM_API_KEY=${NIM_KEY:-nvapi-CHANGE_ME}
VLLM_MODEL_NAME=nemotron-3-nano
EOF

  echo "Generated ${ENV_FILE}"
  echo "Master key: ${MASTER_KEY}"
  echo "SAVE THIS KEY — you'll need it for API access."
else
  echo "Step 2: ${ENV_FILE} already exists, skipping."
  MASTER_KEY=$(grep LITELLM_MASTER_KEY "$ENV_FILE" | cut -d= -f2-)
fi

# ─── Step 3: Pull Ollama models ────────────────────
echo ""
echo "Step 3: Pulling Ollama models..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  echo "Starting Ollama..."
  sudo systemctl start ollama 2>/dev/null || ollama serve &
  sleep 3
fi

# Pull base model and create aliases
echo "Pulling nemotron-nano base model..."
ollama pull llama3.1-nemotron-nano 2>/dev/null || echo "Warning: Could not pull llama3.1-nemotron-nano"

echo "Creating nemotron-3-nano alias..."
echo 'FROM llama3.1-nemotron-nano' | ollama create nemotron-3-nano 2>/dev/null || echo "Warning: Could not create alias"

echo "Pulling nemotron-mini..."
ollama pull nemotron-mini 2>/dev/null || echo "Warning: Could not pull nemotron-mini"

# ─── Step 4: Install systemd services ──────────────
echo ""
echo "Step 4: Installing systemd services..."

sudo cp "${DEPLOY_DIR}/systemd/litellm.service" /etc/systemd/system/
sudo cp "${DEPLOY_DIR}/systemd/warmup-llm.service" /etc/systemd/system/
sudo cp "${DEPLOY_DIR}/systemd/undervolt-frontend.service" /etc/systemd/system/

sudo systemctl daemon-reload
sudo systemctl enable litellm warmup-llm undervolt-frontend

echo "Services installed and enabled."

# ─── Step 5: Configure Ollama optimizations ────────
echo ""
echo "Step 5: Optimizing Ollama for Jetson..."
sudo bash "${REPO_DIR}/scripts/shell/setup_ollama_optimized.sh" nemotron-3-nano

# ─── Step 6: Start LiteLLM ────────────────────────
echo ""
echo "Step 6: Starting LiteLLM gateway..."
sudo systemctl start litellm
sleep 3

# Verify LiteLLM is up
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
  echo "LiteLLM is running on port 4000."
else
  echo "Warning: LiteLLM may not have started. Check: journalctl -u litellm -f"
fi

# ─── Step 7: Create Undervolt team and API key ─────
echo ""
echo "Step 7: Creating Undervolt team and API key..."

# Create team
TEAM_RESPONSE=$(curl -s -X POST http://localhost:4000/team/new \
  -H "Authorization: Bearer ${MASTER_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"team_alias": "undervolt", "max_budget": 100}' 2>/dev/null)

TEAM_ID=$(echo "$TEAM_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('team_id',''))" 2>/dev/null || echo "")

if [ -n "$TEAM_ID" ]; then
  # Create API key
  KEY_RESPONSE=$(curl -s -X POST http://localhost:4000/key/generate \
    -H "Authorization: Bearer ${MASTER_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"team_id\": \"${TEAM_ID}\", \"key_alias\": \"undervolt-prod\"}" 2>/dev/null)

  APP_KEY=$(echo "$KEY_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('key',''))" 2>/dev/null || echo "")

  if [ -n "$APP_KEY" ]; then
    echo "Undervolt API key: ${APP_KEY}"
    echo ""
    echo "Add to frontend/.env.local:"
    echo "  VLLM_BASE_URL=http://localhost:4000/v1"
    echo "  LLM_API_KEY=${APP_KEY}"

    # Auto-update frontend env if it exists
    if [ -f "${FRONTEND_DIR}/.env.local" ]; then
      # Update VLLM_BASE_URL to point at LiteLLM
      sed -i 's|^VLLM_BASE_URL=.*|VLLM_BASE_URL=http://localhost:4000/v1|' "${FRONTEND_DIR}/.env.local"
      # Add or update LLM_API_KEY
      if grep -q "^LLM_API_KEY=" "${FRONTEND_DIR}/.env.local" 2>/dev/null; then
        sed -i "s|^LLM_API_KEY=.*|LLM_API_KEY=${APP_KEY}|" "${FRONTEND_DIR}/.env.local"
      elif grep -q "^# LLM_API_KEY=" "${FRONTEND_DIR}/.env.local" 2>/dev/null; then
        sed -i "s|^# LLM_API_KEY=.*|LLM_API_KEY=${APP_KEY}|" "${FRONTEND_DIR}/.env.local"
      else
        echo "LLM_API_KEY=${APP_KEY}" >> "${FRONTEND_DIR}/.env.local"
      fi
      echo "Updated frontend/.env.local automatically."
    fi
  else
    echo "Warning: Could not create API key. Create manually after setup."
  fi
else
  echo "Warning: Could not create team. LiteLLM may still be starting."
  echo "Run manually after LiteLLM is up:"
  echo "  curl -X POST http://localhost:4000/team/new -H 'Authorization: Bearer ${MASTER_KEY}' -H 'Content-Type: application/json' -d '{\"team_alias\":\"undervolt\"}'"
fi

# ─── Step 8: Build frontend ───────────────────────
echo ""
echo "Step 8: Building Undervolt frontend..."
cd "${FRONTEND_DIR}"
npm install --production=false 2>/dev/null || npm install
npm run build

# ─── Step 9: Start frontend ───────────────────────
echo ""
echo "Step 9: Starting Undervolt frontend..."
sudo systemctl start undervolt-frontend
sleep 2

# ─── Step 10: Warmup ──────────────────────────────
echo ""
echo "Step 10: Warming up LLM..."
sudo systemctl start warmup-llm

# ─── Done ─────────────────────────────────────────
echo ""
echo "========================================"
echo "Deployment complete!"
echo "========================================"
echo ""
echo "Services:"
echo "  Ollama:    http://localhost:11434  (LLM inference)"
echo "  LiteLLM:   http://localhost:4000   (API gateway)"
echo "  Undervolt: http://localhost:3000   (frontend)"
echo ""
echo "Network access (same LAN):"
JETSON_IP=$(hostname -I | awk '{print $1}')
echo "  Undervolt: http://${JETSON_IP}:3000"
echo "  LiteLLM:   http://${JETSON_IP}:4000"
echo ""
echo "Tailscale access (if installed):"
TS_IP=$(tailscale ip -4 2>/dev/null || echo "not configured")
echo "  Undervolt: http://${TS_IP}:3000"
echo "  LiteLLM:   http://${TS_IP}:4000"
echo ""
echo "Verify:"
echo "  curl http://localhost:4000/health"
echo "  curl http://localhost:3000"
echo ""
echo "Re-cache questions:"
echo "  cd ${FRONTEND_DIR} && npx tsx scripts/cache-mode-questions.ts"
echo ""
echo "Logs:"
echo "  journalctl -u litellm -f"
echo "  journalctl -u undervolt-frontend -f"
