const fs = require('fs');
const path = require('path');

try { require('dotenv').config(); } catch (_) {}

function getConn() {
  const url = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || process.env.PGURL;
  if (url && /^postgres(ql)?:\/\//i.test(url)) return url;
  const bogus = process.env.PGPASSWORD;
  if (bogus && /^postgres(ql)?:\/\//i.test(bogus)) return bogus;
  throw new Error('No Postgres connection string. Set SUPABASE_DB_URL / DATABASE_URL / PGURL or put full URL in PGPASSWORD');
}

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node tools/db/exec-sql.js <file.sql>');
    process.exit(1);
  }
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error('SQL file not found:', abs);
    process.exit(1);
  }
  const sql = fs.readFileSync(abs, 'utf8');
  const { Client } = require('pg');
  const client = new Client({ connectionString: getConn(), ssl: { rejectUnauthorized: false } });
  console.log('Connecting...');
  await client.connect();
  try {
    console.log('Executing', path.basename(abs));
    await client.query(sql);
    console.log('Done');
  } finally {
    await client.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });

