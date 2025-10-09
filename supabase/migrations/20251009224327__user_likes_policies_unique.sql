-- ================================================
-- user_likes: insert 전용 정책 + 유니크 제약 (idempotent)
-- 참고: DELETE 정책을 만들지 않아 삭제는 금지됩니다
-- ================================================
BEGIN;

-- user_likes 테이블 RLS 활성화
ALTER TABLE public.user_likes ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있으면 제거
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_likes' AND policyname='user_likes_select_all'
  ) THEN
    DROP POLICY user_likes_select_all ON public.user_likes;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_likes' AND policyname='user_likes_select_self'
  ) THEN
    DROP POLICY user_likes_select_self ON public.user_likes;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_likes' AND policyname='user_likes_insert_self'
  ) THEN
    DROP POLICY user_likes_insert_self ON public.user_likes;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='user_likes' AND policyname='user_likes_delete_self'
  ) THEN
    DROP POLICY user_likes_delete_self ON public.user_likes;
  END IF;
END $$;

-- 누구나 조회 가능(카운트/표시 목적)
CREATE POLICY user_likes_select_all
ON public.user_likes FOR SELECT
USING (true);

-- 본인만 insert 가능
CREATE POLICY user_likes_insert_self
ON public.user_likes FOR INSERT
WITH CHECK (user_id = auth.uid());

-- DELETE 정책을 만들지 않음(= 삭제 금지)

-- (user_id, recipe_id) 유니크 제약이 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_likes_user_recipe_unique'
      AND conrelid = 'public.user_likes'::regclass
  ) THEN
    ALTER TABLE public.user_likes
      ADD CONSTRAINT user_likes_user_recipe_unique UNIQUE (user_id, recipe_id);
  END IF;
END $$;

COMMIT;