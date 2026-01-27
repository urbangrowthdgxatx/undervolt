# Deployment Options for Jan 27 Demo

## Architecture Change (Jan 27, 2025)

The database has been migrated from local SQLite to **Supabase Postgres**. This simplifies deployment -- the Jetson no longer needs the 700MB SQLite file. All data is served from Supabase cloud.

| Component | Where It Runs |
|-----------|---------------|
| Database (2.3M permits) | Supabase cloud Postgres |
| Frontend (Next.js) | Jetson AGX Orin |
| LLM (Ollama) | Jetson AGX Orin |
| GPU clustering pipeline | Jetson AGX Orin |

---

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

**Pros:** Reliable, no hardware dependency. Database already in cloud (Supabase).
**Cons:** No GPU for LLM demo, costs ~$20-50/month

### Simplified by Supabase Migration

Since the database is now in Supabase, a cloud VM only needs to run the Next.js frontend -- no SQLite file transfer needed.

```bash
# Provision Ubuntu 22.04 VM (2GB RAM is enough now)
# ~$12/month

# Clone and setup
git clone git@github.com:urbangrowthdgxatx/undervolt.git
cd undervolt/frontend
npm install

# Copy .env.local (Supabase credentials + Mapbox token)
scp red@jetson:/home/red/Documents/github/undervolt/frontend/.env.local .

# Build and run
npm run build
npm run start
```

No database file to copy. Supabase handles all data serving.

---

## Option 3: Vercel (Easiest)

**Pros:** Zero ops, auto-deploy from GitHub, free tier
**Cons:** No LLM demo (Ollama runs on Jetson only)

### Vercel Setup

```bash
cd frontend
vercel login
vercel --prod
```

### Environment Variables (set in Vercel dashboard)
```
NEXT_PUBLIC_SUPABASE_URL=https://arpoymzcflsqcaqixhie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
NEXT_PUBLIC_MAPBOX_TOKEN=<mapbox token>
```

Database is already in Supabase -- no additional DB hosting needed.

---

## Option 4: Pre-recorded Demo + Static Site

**Pros:** 100% reliable, no live dependencies
**Cons:** Not interactive, less impressive

### Create Recording
```bash
# Record demo with OBS or screen capture
# Upload to YouTube/Vimeo as backup
```

---

## Recommended Strategy

### Primary: Tailscale to Jetson
1. Jetson stays at home, powered on
2. Connect to Tailscale from demo location
3. Access `http://100.87.236.76:3000` directly

### Backup: Vercel Deploy
1. Push to GitHub, deploy to Vercel
2. Set Supabase env vars in Vercel dashboard
3. Dashboard + data works without Jetson
4. Only LLM chat features unavailable

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

# Clear API caches (if data seems stale)
curl -X POST http://localhost:3000/api/stats
curl -X POST http://localhost:3000/api/geojson
curl -X POST http://localhost:3000/api/trends
```

---

## Cost Summary

| Option | Setup Time | Monthly Cost | Reliability | Notes |
|--------|------------|--------------|-------------|-------|
| Tailscale + Jetson | Done | $0 | High | Full demo including LLM |
| Vercel + Supabase | 30 min | $0 (free tier) | Very High | No LLM, but data works |
| Cloud VM | 1 hour | $12-24 | High | No GPU/LLM |
| Pre-recorded | 1 hour | $0 | 100% | Not interactive |

**Recommendation:** Use Tailscale (already set up). Deploy to Vercel as backup. Record a video the day before just in case.
