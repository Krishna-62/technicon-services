import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DATA_DIR points at the Fly.io persistent volume mount (see fly.toml) in production, so the
// SQLite file survives deploys/restarts. Defaults to the local ./data folder for dev.
const dataDir = process.env.DATA_DIR || path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const dbPath = path.join(dataDir, 'technicon.db');
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// Non-destructive migrations for databases created before these columns existed.
function addColumnIfMissing(table, column, ddl) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
}

addColumnIfMissing('sales_record', 'import_batch_id', 'import_batch_id INTEGER REFERENCES import_batch(id)');
addColumnIfMissing('sales_record', 'review_dismissed', 'review_dismissed INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('company_settings', 'default_tax_percent', 'default_tax_percent REAL NOT NULL DEFAULT 18');
addColumnIfMissing('company_settings', 'default_lapse_months', 'default_lapse_months INTEGER NOT NULL DEFAULT 12');

export default db;
