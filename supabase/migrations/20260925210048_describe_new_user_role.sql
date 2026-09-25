-- handle_new_user 설명에 빠져 있던 동작(기본 역할 추가, 기존 프로필 갱신)을 적는다. 동작은 바꾸지 않는다.

comment on function private.handle_new_user() is
  '트리거: auth.users에 가입자가 생기면 메타데이터의 이름·사진으로 공개 프로필을 만들고(이미 있으면 이름·사진·수정 시각을 갱신), private.user_roles에 기본 역할 user를 추가한다. 이미 있는 역할은 바꾸지 않는다(on conflict do nothing). 이름이 없으면 user-<id 앞 8자>를 쓰고 최대 40자로 자른다.';

comment on table private.user_roles is
  '관리자 등 사용자 역할. API로 노출하지 않으며 private.is_admin()이 참조한다. 가입 시 private.handle_new_user가 기본 역할 user를 넣고, 관리자 지정은 DB에서 직접 한다.';
