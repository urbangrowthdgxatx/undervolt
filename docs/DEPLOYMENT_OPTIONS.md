# Deployment Options for Jan 27 Demo

## Option 1: Remote Access to Jetson (Recommended)

**Pros:** Real hardware demo, authentic performance metrics
**Cons:** Requires stable internet, Jetson must stay powered on

### Setup

```bash
# On Jetson - ensure services are running
sudo systemctl enable ollama undervolt-frontend
sudo systemctl start ollama undervolt-frontend

# Get Jetson's public IP or set up port forwarding
# If behind NAT, use ngrok or similar:
ngrok http 3000
```

### From Demo Location

- Access via ngrok URL or direct IP
- SSH tunnel for backup: `ssh -L 3000:localhost:3000 red@jetson-ip`

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

### Primary: Remote Jetson Access

1. Set up ngrok tunnel before leaving
2. Test connection from phone hotspot
3. Have backup mobile hotspot ready

### Backup: Cloud VM

1. Spin up DigitalOcean droplet now ($24/mo)
2. Deploy and test this week
3. Keep running until after demo

### Emergency: Pre-recorded Video

1. Record 5-min demo walkthrough
2. Export key stats as static JSON
3. Have slides ready with screenshots

---

## Pre-Demo Checklist

### 3 Days Before

- [ ] Test Jetson remote access from different network
- [ ] Set up cloud VM backup
- [ ] Record demo video as emergency backup
- [ ] Test all demo scenarios

### Day Before

- [ ] Verify Jetson is accessible
- [ ] Check cloud backup is running
- [ ] Charge laptop, test hotspot
- [ ] Download offline copy of presentation

### Day Of

- [ ] SSH into Jetson, verify services running
- [ ] Test dashboard loads
- [ ] Have cloud URL ready as backup
- [ ] Have video ready as last resort

---

## Quick Commands Reference

```bash
# Check Jetson remotely
ssh red@jetson-ip "systemctl status ollama undervolt-frontend"

# Restart services
ssh red@jetson-ip "sudo systemctl restart ollama undervolt-frontend"

# Check dashboard
curl -s http://jetson-ip:3000/api/stats | head -c 200

# Ngrok tunnel (run on Jetson)
ngrok http 3000

# Cloud deploy (one-liner)
ssh root@cloud-ip "cd /app/undervolt && git pull && cd frontend && npm run build && pm2 restart all"
```

---

## Cost Summary

| Option | Setup Time | Monthly Cost | Reliability |
|--------|------------|--------------|-------------|
| Remote Jetson | 30 min | $0 | Medium (internet dependent) |
| Cloud VM | 2 hours | $24-48 | High |
| Vercel + Turso | 1 hour | $0 (free tier) | Very High |
| Pre-recorded | 1 hour | $0 | 100% |

**Recommendation:** Set up Cloud VM as backup this week. It's worth $24 for peace of mind.
