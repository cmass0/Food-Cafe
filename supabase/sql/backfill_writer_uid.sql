-- Backfill writer_uid on recipes using email or legacy map

-- 1) via profiles.email (if exists)
update public.recipes r
set writer_uid = p.id::uuid
from public.profiles p
where r.writer_uid is null
  and r.writer_email is not null
  and lower(p.email) = lower(r.writer_email);

-- 2) via legacy lookup table (users_raw: firebase_uid text, email text)
-- create table users_raw(firebase_uid text primary key, email text);
update public.recipes r
set writer_uid = p.id::uuid
from users_raw u
join public.profiles p on lower(p.email) = lower(u.email)
where r.writer_uid is null
  and r.writer_uid_legacy is not null
  and r.writer_uid_legacy = u.firebase_uid;
