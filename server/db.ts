import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

const sqlite = new Database('spinesurge.db');
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
export default db;

// Export the underlying sqlite instance for manual operations if needed
export { sqlite };
