const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
(async () => {
  try {
    if (!url || !key) {
      console.error('Missing URL or key', { url, hasKey: !!key });
      process.exit(1);
    }
    const res = await fetch(`${url}/rest/v1/users?select=*`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json'
      }
    });
    const text = await res.text();
    console.log('status', res.status, res.statusText);
    console.log(text);
  } catch (e) {
    console.error('fetch error', e);
  }
})();
