import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { join } from 'path';
import * as schema from './schema';

// Database file location
const dbPath = join(process.cwd(), 'data', 'undervolt.db');

// Create SQLite connection
const sqlite = new Database(dbPath);

// Enable WAL mode for better concurrency
sqlite.pragma('journal_mode = WAL');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

export * from './schema';
