-- public.users는 옛 users 테이블을 profiles로 바꿀 때 남긴 호환용 뷰다.
-- 앱·DB 함수·다른 뷰 어디에서도 참조하지 않으므로 삭제한다.
drop view public.users;
