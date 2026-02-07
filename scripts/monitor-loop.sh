#!/bin/bash
# Monitoring loop: DB status every 10 min, System usage every 1 hour
cd /home/red/Documents/github/undervolt

echo "🔄 Starting monitoring loop..."
echo "   - Database status: every 10 minutes"
echo "   - System usage: every 1 hour"
echo ""

DB_INTERVAL=600      # 10 minutes in seconds
SYS_INTERVAL=3600    # 1 hour in seconds

last_db=0
last_sys=0

# Run both immediately on start
echo "📊 Initial status check..."
npx tsx scripts/monitor-db.ts
bash scripts/monitor-system.sh

last_db=$(date +%s)
last_sys=$(date +%s)

while true; do
    current=$(date +%s)

    # Check if 10 minutes passed for DB status
    if (( current - last_db >= DB_INTERVAL )); then
        npx tsx scripts/monitor-db.ts
        last_db=$current
    fi

    # Check if 1 hour passed for system status
    if (( current - last_sys >= SYS_INTERVAL )); then
        bash scripts/monitor-system.sh
        last_sys=$current
    fi

    # Sleep 30 seconds between checks
    sleep 30
done
