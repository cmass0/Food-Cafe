-- public.users_public은 profiles에서 공개 컬럼만 골라 보여 주던 뷰다.
-- profiles에서 비공개 컬럼이 모두 빠진 뒤로 두 객체의 내용이 같아졌고, 앱은 profiles를 직접 조회한다.
drop view public.users_public;
