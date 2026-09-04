// One-time schema setup. Run with DATABASE_URL pointed at the target Postgres
// (local Docker Postgres for dev, or the Supabase connection string for production):
//   DATABASE_URL=postgres://... node scripts/setup-db.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error('Set DATABASE_URL first, e.g. DATABASE_URL=postgres://... node scripts/setup-db.js');
  process.exit(1);
}

const schemaPath = path.resolve(__dirname, '../api/_lib/db/schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');

const isLocal = process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1');
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log('Connected. Running schema...');
  await client.query(schema);
  console.log('Schema applied successfully.');
  await client.end();
}

run().catch((err) => {
  console.error('Schema setup failed:', err.message);
  process.exit(1);
});
