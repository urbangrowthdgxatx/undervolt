#!/usr/bin/env tsx

import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'data', 'undervolt.db');

console.log('Opening database:', dbPath);
const db = new Database(dbPath);

console.log('\n=== Before Checkpoint ===');
const beforeCount = db.prepare('SELECT COUNT(*) as cnt FROM permits').get() as { cnt: number };
console.log('Permits:', beforeCount.cnt.toLocaleString());

console.log('\n=== Running WAL Checkpoint ===');
db.pragma('wal_checkpoint(TRUNCATE)');

console.log('\n=== After Checkpoint ===');
const afterCount = db.prepare('SELECT COUNT(*) as cnt FROM permits').get() as { cnt: number };
console.log('Permits:', afterCount.cnt.toLocaleString());

// Show all table counts
console.log('\n=== Final Database State ===');
const tables = ['permits', 'clusters', 'cluster_keywords', 'energy_stats_by_zip', 'trends', 'cache_metadata'];
tables.forEach(table => {
  const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get() as { cnt: number };
  console.log(`${table.padEnd(25)} ${count.cnt.toLocaleString()} rows`);
});

db.close();
console.log('\n✓ Database checkpoint complete');
