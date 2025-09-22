-- Recipe primary key migration: text -> uuid(v7) while retaining Firestore ids
-- Intended to run after initial import using text ids.

begin;

create extension if not exists pgcrypto;

create or replace function public.uuid_v7()
returns uuid
language plpgsql
as $$
declare
  ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
  time_hex text := lpad(to_hex(ms), 12, '0');
  r1 text := encode(gen_random_bytes(8), 'hex');
  r2 text := encode(gen_random_bytes(8), 'hex');
  b1 text := substr(time_hex, 1, 8);
  b2 text := substr(time_hex, 9, 4);
  rand_a3 text := substr(r1, 1, 3);
  variant_nibbles text[] := array['8','9','a','b'];
  v_hi text := variant_nibbles[(get_byte(gen_random_bytes(1),0) & 3)+1];
  b4_tail text := substr(r2, 1, 3);
  b5 text := substr(r2, 4, 12);
  uuid_txt text;
begin
  uuid_txt := format('%s-%s-%s-%s-%s', b1, b2, '7'||rand_a3, v_hi||b4_tail, b5);
  return uuid_txt::uuid;
end;
$$;

do $$
begin
  -- preserve original text id in legacy_id
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='recipes' and column_name='legacy_id'
  ) then
    alter table public.recipes add column legacy_id text;
    update public.recipes set legacy_id = id where legacy_id is null;
    create unique index if not exists idx_recipes_legacy_id on public.recipes(legacy_id);
  end if;

  -- stage new uuid column
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='recipes' and column_name='id_new'
  ) then
    alter table public.recipes add column id_new uuid;
    update public.recipes set id_new = public.uuid_v7() where id_new is null;
  end if;

  -- swap primary key
  begin
    alter table public.recipes drop constraint if exists recipes_pkey;
  exception when undefined_object then null;
  end;
  alter table public.recipes add constraint recipes_pkey primary key (id_new);

  alter table public.recipes rename column id to id_text_old;
  alter table public.recipes rename column id_new to id;
  alter table public.recipes alter column id set default public.uuid_v7();
end$$;

commit;
