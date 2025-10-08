const { createClient } = require('@supabase/supabase-js');
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
(async () => {
  if (!url || !key) {
    console.error('Missing URL or key');
    process.exit(1);
  }
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('aaa').insert([
    {},
    {}
  ]).select();
  if (error) {
    console.error('insert error', error);
    process.exit(1);
  }
  console.log('inserted', JSON.stringify(data, null, 2));
})();
