const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const projectRef = 'vtkcngubofjqddqvcufp';
const pat = process.env.SUPABASE_ACCESS_TOKEN;
(async () => {
  const url = `https://api.supabase.com/v2/projects/${projectRef}/sql`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${pat}`,
      apikey: pat,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ q: 'select 1' })
  });
  console.log('url', url);
  console.log('status', res.status, res.statusText);
  console.log(await res.text());
})();
