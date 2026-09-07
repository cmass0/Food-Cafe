const fs = require('fs');
const path = require('path');

// Load .env if present
try { require('dotenv').config(); } catch {}

function getConnectionString() {
  // Prefer an explicit URL if provided
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.PGURL;
  if (url && /^postgres(ql)?:\/\//i.test(url)) return url;

  // Fallback: some projects store the full URL incorrectly in PGPASSWORD
  const bogus = process.env.PGPASSWORD;
  if (bogus && /^postgres(ql)?:\/\//i.test(bogus)) return bogus;

  throw new Error(
    'No Postgres connection string found. Set SUPABASE_DB_URL (or DATABASE_URL / PGURL), or store the full URL in PGPASSWORD.'
  );
}

async function main() {
  const file = path.resolve('supabase/sql/0005_posts_align_with_existing.sql');
  if (!fs.existsSync(file)) {
    throw new Error(`SQL file not found: ${file}`);
  }
  const sql = fs.readFileSync(file, 'utf8');

  const connStr = getConnectionString();

  // Lazy import to keep script dependency-free if not run
  const { Client } = require('pg');

  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
  });

  console.log('Connecting to database...');
  await client.connect();
  try {
    console.log('Applying migration 0005...');
    await client.query(sql);
    console.log('Migration 0005 applied successfully.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Failed to apply migration:', err.message);
  process.exitCode = 1;
});
