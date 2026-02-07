import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'undervolt.db');

function getDbStats() {
  const db = new Database(dbPath, { readonly: true });

  const timestamp = new Date().toLocaleString();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 DATABASE STATUS - ${timestamp}`);
  console.log('='.repeat(60));

  // Get table counts
  const tables = [
    { name: 'permits', query: 'SELECT COUNT(*) as count FROM permits' },
    { name: 'clusters', query: 'SELECT COUNT(*) as count FROM clusters' },
    { name: 'cluster_keywords', query: 'SELECT COUNT(*) as count FROM cluster_keywords' },
    { name: 'energy_stats_by_zip', query: 'SELECT COUNT(*) as count FROM energy_stats_by_zip' },
    { name: 'trends', query: 'SELECT COUNT(*) as count FROM trends' },
    { name: 'cache_metadata', query: 'SELECT COUNT(*) as count FROM cache_metadata' },
  ];

  console.log('\n📋 Table Record Counts:');
  for (const table of tables) {
    try {
      const result = db.prepare(table.query).get() as { count: number };
      console.log(`   ${table.name.padEnd(20)} ${result.count.toLocaleString().padStart(10)} records`);
    } catch (e) {
      console.log(`   ${table.name.padEnd(20)} [table not found]`);
    }
  }

  // Energy permit breakdown
  try {
    const energyStats = db.prepare(`
      SELECT
        energy_type,
        COUNT(*) as count
      FROM permits
      WHERE is_energy_permit = 1 AND energy_type IS NOT NULL
      GROUP BY energy_type
      ORDER BY count DESC
    `).all() as { energy_type: string; count: number }[];

    console.log('\n⚡ Energy Permits by Type:');
    for (const stat of energyStats) {
      console.log(`   ${(stat.energy_type || 'unknown').padEnd(20)} ${stat.count.toLocaleString().padStart(10)}`);
    }
  } catch (e) {
    console.log('\n⚡ Energy stats not available');
  }

  // Recent activity (permits by year)
  try {
    const yearlyStats = db.prepare(`
      SELECT
        substr(issue_date, 1, 4) as year,
        COUNT(*) as count
      FROM permits
      WHERE issue_date IS NOT NULL
      GROUP BY year
      ORDER BY year DESC
      LIMIT 5
    `).all() as { year: string; count: number }[];

    console.log('\n📅 Permits by Year (recent):');
    for (const stat of yearlyStats) {
      console.log(`   ${stat.year.padEnd(20)} ${stat.count.toLocaleString().padStart(10)}`);
    }
  } catch (e) {
    console.log('\n📅 Yearly stats not available');
  }

  // Database file size
  const fs = require('fs');
  const stats = fs.statSync(dbPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n💾 Database Size: ${sizeMB} MB`);

  db.close();
  console.log('='.repeat(60) + '\n');
}

getDbStats();
