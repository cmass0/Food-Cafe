const { Client } = require('pg');
const conn = process.env.PGPASSWORD;
if (!conn) { console.error('missing conn'); process.exit(1); }
const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
(async () => {
  try {
    await client.connect();
    const res = await client.query('select * from public.users limit 5');
    console.log(res.rows);
  } catch (err) {
    console.error('pg error', err);
  } finally {
    await client.end().catch(() => {});
  }
})();
