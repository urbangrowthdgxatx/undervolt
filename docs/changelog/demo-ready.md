# Demo Ready!

Your analytics-powered Austin construction explorer is **live and working**!

## Access Your App

- **Local**: http://localhost:3000
- **Network**: http://192.168.4.124:3000 (access from other devices on your network)
- **Tailscale**: http://100.87.236.76:3000 (remote access)

## What's Working

### Database (Supabase Postgres)
- **2,303,817 permits** loaded in Supabase cloud Postgres
- **All 5 API routes** migrated to `@supabase/supabase-js`
- **Single RPC call** (`get_dashboard_stats`) for dashboard stats
- **50K row API limit** configured for GeoJSON endpoint
- **Row Level Security** enabled on all tables

### Analytics Engine (No LLM Required)
- Model indicator shows status in UI
- 8 unique response types for different queries
- Concise, focused messages
- Full StoryBlock format with charts, evidence, and insights
- No API keys needed for analytics -- runs on pre-computed data

### Data Coverage
- **2,303,817 permits** analyzed (all construction types)
- **115,523 energy permits** tracked
- **8 ML clusters** with auto-generated names
- **840 ZIP codes** covered
- **86% categorized** with LLM categories (project_type, building_type, trade, scale)
- **Growth trends** (2009-2025) -- Demolition +547% CAGR

## Try These Queries

### Growth & Trends
- "What's growing fastest?"
- "Show me Austin trends"

### Energy Infrastructure
- "Show me energy data"
- "Tell me about solar"
- "Battery installations"

### Geographic
- "Tell me about ZIP 78758"
- "ZIP 78704"

### Changes Over Time
- "How has construction changed since 2020?"

### Overview
- "Tell me about Austin"
- "What are the main insights?"

## Technical Details

### Current Setup
- **Frontend**: Next.js 16 on port 3000
- **Node**: v20.20.0 (via nvm)
- **Database**: Supabase Postgres (cloud)
- **Client**: @supabase/supabase-js v2
- **LLM**: Ollama + Llama 3.2:3b (local, optional)

### API Endpoints (All Supabase-backed)

| Endpoint | Method | Notes |
|----------|--------|-------|
| `/api/stats` | `supabase.rpc('get_dashboard_stats')` | ~200ms, then cached |
| `/api/permits` | `supabase.from('permits').select()` | Paginated, filterable |
| `/api/geojson` | `supabase.from('permits').select()` | 50K points, cached |
| `/api/permits-detailed` | `supabase.from('permits').select()` | Multi-filter |
| `/api/trends` | `supabase.from('trends').select()` | Monthly data |

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://arpoymzcflsqcaqixhie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<configured in .env.local>
NEXT_PUBLIC_MAPBOX_TOKEN=<configured in .env.local>
```

## Key Insights (Talking Points)

1. **2.3M permits** -- Full Austin construction history, not just energy
2. **Demolition Boom**: +547% CAGR -- Austin is tearing down old to build new
3. **Battery Gap**: Only 1 battery for every 22 solar installations
4. **Post-Freeze Effect**: Generator permits +246%, battery +214% after 2021
5. **Resilience Gap**: District 10 has 12x more generators than District 4
6. **Growth Corridors**: 78758, 78704, 78759 lead in total permits
7. **86% Categorized**: LLM + rules classify project type, building, trade, scale

## Known Issues

### Resolved
- Node version (using v20 via nvm)
- SQLite dependency removed (migrated to Supabase)
- All 5 DB routes rewritten for Supabase
- API row limit set to 50K for GeoJSON
- Function search_path security advisory fixed

### Not Critical for Demo
- WebGL warning (from map component, cosmetic)
- drizzle-orm still in package.json (unused, cleanup later)

## Demo Script

1. **Show the UI**: "This analyzes 2.3 million Austin construction permits"
2. **Point out**: Dashboard stats load from Supabase in <1 second
3. **Ask**: "What's growing fastest?"
4. **Highlight**: Story block with chart -- Demolition +547%
5. **Ask**: "Show me energy data"
6. **Surprise**: Battery gap -- only 1 for every 22 solar installations
7. **Ask**: "Tell me about ZIP 78704"
8. **Map**: Shows 93K+ permits in South Congress area
9. **Technical**: "Data served from Supabase Postgres, LLM runs locally on Jetson"

## You're Ready!

Open http://localhost:3000 and start exploring Austin's construction data!
