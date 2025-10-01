-- =========================================================
--  users / recipes / user_likes migration (idempotent)
--  Note: if your database uses `image_path` instead of `image`, replace the column name accordingly.
-- =========================================================
begin;

-- 0) Safety guard: ensure schema exists
create schema if not exists public;

-- 1) USERS: column normalization and missing fields
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'displayname'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN displayname TO display_name;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'create_At'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN create_At TO created_at;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS email      text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- derived column: role = 'admin' => true
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.users
      ADD COLUMN is_admin boolean GENERATED ALWAYS AS (role = 'admin') STORED;
  END IF;
END $$;

-- optional helper function: create if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_admin'
  ) THEN
    CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
    RETURNS boolean
    LANGUAGE sql
    SECURITY DEFINER
    STABLE
    AS $fn$
      SELECT coalesce(u.is_admin, false)
      FROM public.users u
      WHERE u.id = uid
    $fn$;
    COMMENT ON FUNCTION public.is_admin(uuid) IS 'Return true if users.is_admin for the given uid.';
  END IF;
END $$;

-- 2) RECIPES: writer FK, trigger, image constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'recipes'
      AND constraint_name = 'recipes_writer_fk'
  ) THEN
    ALTER TABLE public.recipes
      ADD CONSTRAINT recipes_writer_fk
      FOREIGN KEY (writer_uid) REFERENCES public.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_writer_uid()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.writer_uid IS NULL THEN
    NEW.writer_uid := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_recipes_set_writer ON public.recipes;
CREATE TRIGGER trg_recipes_set_writer
BEFORE INSERT ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.set_writer_uid();

ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS recipes_image_required;

ALTER TABLE public.recipes
  ADD CONSTRAINT recipes_image_required
  CHECK (coalesce(nullif(trim(image), ''), NULL) IS NOT NULL);

-- 3) USER_LIKES table + indexes + RLS policies
CREATE TABLE IF NOT EXISTS public.user_likes (
  user_id    uuid NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
  recipe_id  uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_user_likes_user   ON public.user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_recipe ON public.user_likes(recipe_id);

ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_likes_select_all ON public.user_likes;
CREATE POLICY user_likes_select_all
ON public.user_likes FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS user_likes_insert_self ON public.user_likes;
CREATE POLICY user_likes_insert_self
ON public.user_likes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS user_likes_delete_self ON public.user_likes;
CREATE POLICY user_likes_delete_self
ON public.user_likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- 4) USERS table RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_all ON public.users;
CREATE POLICY users_select_all
ON public.users FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS users_insert_self_or_admin ON public.users;
CREATE POLICY users_insert_self_or_admin
ON public.users FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS users_update_self_or_admin ON public.users;
CREATE POLICY users_update_self_or_admin
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid() OR is_admin(auth.uid()))
WITH CHECK (id = auth.uid() OR is_admin(auth.uid()));

DROP POLICY IF EXISTS users_delete_admin_only ON public.users;
CREATE POLICY users_delete_admin_only
ON public.users FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

commit;
