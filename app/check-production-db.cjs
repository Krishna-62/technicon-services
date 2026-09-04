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

async function check() {
  try {
    await client.connect();

    console.log("\n✅ Connected successfully\n");

    const db = await client.query(`
      SELECT
        current_database() AS database,
        current_user AS user,
        version() AS postgres_version
    `);

    console.log("Database information:");
    console.table(db.rows);

    const tableCheck = await client.query(`
      SELECT to_regclass('public.quotation_follow_up') AS table_name
    `);

    const exists = tableCheck.rows[0].table_name;

    console.log(
      "\nquotation_follow_up:",
      exists ? `EXISTS (${exists})` : "DOES NOT EXIST"
    );

    for (const tableName of ["quotation", "app_user"]) {
      const result = await client.query(
        `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
        `,
        [tableName]
      );

      console.log(`\n${tableName} columns:`);
      console.table(result.rows);
    }

    if (exists) {
      const followUp = await client.query(`
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'quotation_follow_up'
        ORDER BY ordinal_position
      `);

      console.log("\nquotation_follow_up columns:");
      console.table(followUp.rows);

      const indexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
          AND tablename = 'quotation_follow_up'
        ORDER BY indexname
      `);

      console.log("\nquotation_follow_up indexes:");
      console.table(indexes.rows);
    }

    console.log("\n✅ Read-only production inspection completed.");
  } catch (error) {
    console.error("\n❌ Database inspection failed:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

check();