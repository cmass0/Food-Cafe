const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const projectRef = 'vtkcngubofjqddqvcufp';
const pat = process.env.SUPABASE_ACCESS_TOKEN;
(async () => {
  try {
    if (!pat) {
      console.error('Missing SUPABASE_ACCESS_TOKEN');
      process.exit(1);
    }
    const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
    const query = "alter table public.aaa add column if not exists age integer;";
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${pat}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({ query, read_only: false })
    });
    const text = await res.text();
    console.log('status', res.status, res.statusText);
    console.log(text);
  } catch (e) {
    console.error('fetch error', e);
  }
})();
