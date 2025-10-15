# Post Supabase Migration Checklist

- [ ] Apply supabase/sql/0004_posts.sql migration (posts table, indices, RLS, RPC).
- [ ] Seed initial posts data if required (insert into posts ...).
- [ ] Update env (SUPABASE_URL, SUPABASE_ANON_KEY) and run supabase db push.
- [ ] Verify service layer (src/features/post/service.ts) CRUD with Supabase console.
- [ ] Update UI/Routes (/posts, /commu) to ensure posts render from Supabase API.
- [ ] Remove legacy Firebase data paths once Supabase data validated.
