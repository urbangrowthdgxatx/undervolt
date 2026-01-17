# Deployment Options for Jan 27 Demo

## Option 1: Tailscale to Jetson (Recommended)

**Pros:** Real hardware demo, authentic GPU performance, zero cost, encrypted
**Cons:** Requires Jetson to stay powered on and connected

### Tailscale Details

| Device | Tailscale IP | Status |
|--------|--------------|--------|
| Jetson (red-desktop-1) | `100.87.236.76` | Primary |

### Setup (Already Done)

```bash
# Tailscale is already running on Jetson
tailscale status

# Ensure services are running
sudo systemctl enable ollama undervolt-frontend
sudo systemctl start ollama undervolt-frontend
```

### From Demo Location

1. Connect to Tailscale on your laptop/phone
2. Access dashboard: `http://100.87.236.76:3000`
3. SSH if needed: `ssh red@100.87.236.76`

No port forwarding, no tunnels, no dynamic URLs.

---

## Option 2: Cloud VM Deployment (Best Backup)

**Pros:** Reliable, no hardware dependency
**Cons:** No GPU (CPU-only), costs ~$20-50/month

### Recommended: DigitalOcean or Vultr

```bash
# Provision Ubuntu 22.04 VM (4GB RAM minimum)
# $24/month for 4GB RAM, 2 vCPU

# Install dependencies
sudo apt update && sudo apt install -y nodejs npm python3 python3-pip

# Clone and setup
git clone git@github.com:urbangrowthdgxatx/undervolt.git
cd undervolt/frontend
npm install
npm run build

# Copy database from Jetson
scp red@jetson:/home/red/Documents/github/undervolt/data/undervolt.db ./data/

# Run production server
npm run start
```

### Quick Deploy Script

```bash
#!/bin/bash
# deploy-cloud.sh

# Variables
SERVER_IP="your-server-ip"
SSH_KEY="~/.ssh/id_rsa"

# Copy database
scp -i $SSH_KEY data/undervolt.db root@$SERVER_IP:/app/data/

# Deploy
ssh -i $SSH_KEY root@$SERVER_IP << 'EOF'
cd /app/undervolt/frontend
git pull
npm install
npm run build
pm2 restart undervolt || pm2 start npm --name "undervolt" -- start
EOF
```

---

## Option 3: Vercel/Railway (Easiest)

**Pros:** Zero ops, auto-deploy from GitHub
**Cons:** Need to host DB separately, no LLM demo

### Vercel Setup

```bash
cd frontend
vercel login
vercel --prod
```

### Database Options

1. **Turso (SQLite in cloud)** - Free tier, easiest migration
   ```bash
   turso db create undervolt
   turso db shell undervolt < data/undervolt.db
   ```

2. **PlanetScale (MySQL)** - Free tier, requires schema migration

3. **Supabase (Postgres)** - Free tier, requires schema migration

---

## Option 4: Pre-recorded Demo + Static Site

**Pros:** 100% reliable, no live dependencies
**Cons:** Not interactive, less impressive

### Create Recording

```bash
# Record demo with OBS or screen capture
# Upload to YouTube/Vimeo as backup

# Export static data for charts
curl http://localhost:3000/api/stats > static-stats.json
```

### Static Site with Screenshots

- Export dashboard screenshots
- Create slide deck with embedded images
- Show recorded video of live filtering

---

## Recommended Strategy

### Primary: Tailscale to Jetson

1. Jetson stays at home, powered on
2. Connect to Tailscale from demo location
3. Access `http://100.87.236.76:3000` directly

### Backup: Cloud VM

1. Only if Tailscale/Jetson fails
2. Pre-deploy to DigitalOcean if paranoid
3. Most likely won't need this

### Emergency: Pre-recorded Video

1. Record 5-min demo walkthrough as last resort
2. Keep on phone/laptop offline

---

## Pre-Demo Checklist

### 3 Days Before

- [ ] Test Tailscale access from phone (different network)
- [ ] Run `./scripts/pre-demo-check.sh` - fix any issues
- [ ] Record demo video as emergency backup
- [ ] Test all demo scenarios end-to-end

### Day Before

- [ ] Run `./scripts/pre-demo-check.sh` again
- [ ] Verify Jetson stays online overnight (disable sleep)
- [ ] Charge laptop, ensure Tailscale app installed
- [ ] Download offline copy of presentation

### Day Of

- [ ] Run `./scripts/pre-demo-check.sh` before leaving
- [ ] Test from phone on mobile data (not home WiFi)
- [ ] Have pre-recorded video on phone as backup

---

## Quick Commands Reference

```bash
# Check Jetson remotely via Tailscale
ssh red@100.87.236.76 "systemctl status ollama undervolt-frontend"

# Restart services
ssh red@100.87.236.76 "sudo systemctl restart ollama undervolt-frontend"

# Check dashboard is responding
curl -s http://100.87.236.76:3000/api/stats | head -c 200

# Run pre-demo check script
./scripts/pre-demo-check.sh

# Cloud deploy (one-liner) - only if needed
ssh root@cloud-ip "cd /app/undervolt && git pull && cd frontend && npm run build && pm2 restart all"
```

---

## Cost Summary

| Option | Setup Time | Monthly Cost | Reliability |
|--------|------------|--------------|-------------|
| Tailscale + Jetson | Done | $0 | High (encrypted, no NAT issues) |
| Cloud VM | 2 hours | $24-48 | High |
| Vercel + Turso | 1 hour | $0 (free tier) | Very High |
| Pre-recorded | 1 hour | $0 | 100% |

**Recommendation:** Use Tailscale (already set up). Record a backup video the day before just in case.
