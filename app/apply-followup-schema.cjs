const { Client } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function applySchema() {
  try {
    await client.connect();

    console.log("\nConnected to production database.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS quotation_follow_up (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER NOT NULL
          REFERENCES quotation(id) ON DELETE CASCADE,
        follow_up_date DATE NOT NULL,
        notes TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'scheduled'
          CHECK (status IN ('scheduled', 'completed', 'cancelled')),
        created_by INTEGER NOT NULL
          REFERENCES app_user(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP,
        completed_by INTEGER
          REFERENCES app_user(id),
        outcome TEXT,
        outcome_notes TEXT
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_follow_up_quotation
      ON quotation_follow_up(quotation_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_follow_up_date_status
      ON quotation_follow_up(follow_up_date, status);
    `);

    console.log("Schema applied successfully.");

    const columns = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'quotation_follow_up'
      ORDER BY ordinal_position;
    `);

    console.log("\nquotation_follow_up columns:");
    console.table(columns.rows);

    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'quotation_follow_up'
      ORDER BY indexname;
    `);

    console.log("\nquotation_follow_up indexes:");
    console.table(indexes.rows);

    const count = await client.query(`
      SELECT COUNT(*) AS count
      FROM quotation_follow_up;
    `);

    console.log(
      "\nCurrent follow-up rows:",
      count.rows[0].count
    );

    console.log("\nProduction follow-up schema verified successfully.");
  } catch (error) {
    console.error("\nSchema application failed:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

applySchema();