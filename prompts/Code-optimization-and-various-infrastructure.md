# Auth Account Linking: Manual Flow (Email mismatch)

목표
- 소셜 OAuth와 기존 이메일/비밀번호 계정의 이메일이 일치하지 않는 경우, 사용자가 계정을 수동으로 연결할 수 있는 플로우를 제공한다.

배경
- 자동 연결(Email account linking)은 동일/검증된 이메일에 한함. 이메일 상이 시 별도 user.id가 생성될 수 있음.

요구사항
- 로그인된 상태에서 추가 Provider 연결 버튼 제공: `linkIdentity({ provider })`
- 미로그인 상태에서 “기존 계정으로 로그인 후 연결 안내” UI 제공
- 연결 성공 시 `user.identities`에 provider 추가됨을 확인
- Edge: provider별 scope 안내 (google: profile email, kakao: profile_nickname account_email)

수용 기준(AC)
- 프로필/설정 화면에 “계정 연결” UI 노출(권한 체크)
- 연결/실패/취소 상태 메시지 처리
- 동일 provider 중복 요청 방지(비활성화 or 가드)
- 보안: 리다이렉트 허용 URL, CSRF 고려

체크리스트
- [ ] UI 컴포넌트/버튼 추가
- [ ] linkIdentity 호출 및 예외처리
- [ ] 연동 후 세션/표시 즉시 반영


# Auth Infra: DB Triggers + Auth Webhooks

목표
- 최초 로그인/가입 시 `public.users` 레코드 생성이 항상 보장되도록 DB 트리거를 추가한다.
- (옵션) Supabase Auth Webhooks → Edge Function으로 웰컴 메일/이벤트 발행 등 사이드이펙트를 처리한다.

배경
- /auth/callback에서 최초 사용자 프로필을 생성하지만, FE/라우팅 실패 등에 영향받을 수 있음.
- DB 트리거나 Webhook은 서버/플랫폼 레벨에서 보장해 신뢰도를 높임.

요구사항
1) DB 트리거 (권장 기본)
- 함수: `public.handle_new_user()` (SECURITY DEFINER, 멱등) 
- 트리거: `on_auth_user_created` (after insert on auth.users)
- insert 시 source: `new.raw_user_meta_data`에서 display_name 후보(full_name/name) → email local-part → 'user'
- `on conflict (id) do nothing`로 멱등 처리
- 필요한 RLS 우회/권한 설정 포함(set search_path)

2) Auth Webhook + Edge Function (옵션)
- Dashboard에 user.created webhook 등록 → Edge Function에서 upsert + 추가 사이드이펙트(환영 메일/이벤트)
- 재시도/멱등키: user.id

수용 기준(AC)
- SQL 마이그레이션 파일 추가(`supabase/sql` 또는 `supabase/migrations`) 및 적용
- 신규 가입/소셜 최초 로그인 시 `public.users` 자동 생성 확인
- 기존 /auth/callback 로직과 중복되어도 중복 insert 없이 멱등 동작
- (옵션) Webhook 경로/시크릿 구성 및 간단한 로그 확인

체크리스트
- [ ] 함수/트리거 SQL 작성 및 로컬 적용
- [ ] 테스트: 새 프로젝트 사용자로 로그인 → users 행 존재
- [ ] 보안: SECURITY DEFINER, search_path 고정, 최소 권한
- [ ] (옵션) Edge Function 배포 및 Webhook 연동