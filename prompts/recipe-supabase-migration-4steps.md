# 레시피 이관 실행 가이드(4파트) — lib / features / app / middleware

이 문서는 아래 파일 구조를 기준으로 4개의 파트(lib, features, app, middleware)로 나눠 실행·검증할 항목을 정리합니다.

참고 구조(요약)
- `src/lib/supabase/{browser.ts, server.ts}`
- `src/features/recipe/{types.ts, schema.ts, repository.ts, service.ts, ui/*}`
- `src/app/recipes/{page.tsx, new/page.tsx, [id]/page.tsx, actions.ts}`
- `src/middleware.ts` (선택)

공통 전제
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`(클라), `SUPABASE_URL`(옵션), `SUPABASE_SERVICE_ROLE_KEY`(서버 전용, 노출 금지)
- DB/RLS: `recipes/users/posts/comments` 테이블 RLS ON, 정책 적용 완료 상태

---

## 1) lib — Supabase 클라이언트

목적
- 브라우저/서버에서 각각 안전한 Supabase 클라이언트를 제공하고 세션 기반 RLS를 준수한다.

구현(요약)
- `src/lib/supabase/browser.ts`
  - `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`로 클라 클라이언트 팩토리
  - 캐시/싱글턴 고려(필요 시)
- `src/lib/supabase/server.ts`
  - `createServerClient(SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies })`
  - 서버 액션/Route Handler/Server Component에서 쿠키 전파

검증
- 익명 SELECT: 서버 컴포넌트에서 `recipes` 목록 조회 성공
- 인증 세션 전파: 로그인 후 변이(create/update/delete)가 서버 액션에서 성공하고, 비로그인은 거부됨(401/403)

체크리스트
- [ ] 클라 키(anon)는 브라우저에서만 사용, 서비스 롤 키는 절대 노출 금지
- [ ] 서버에서만 변이 실행(클라에서 write 금지)

---

## 2) features/recipe — 타입/검증/저장소/서비스/UI

목적
- 도메인 로직을 레이어별로 분리하고 재사용성을 높인다.

구현(요약)
- `types.ts`: DB 타입 기반 `RecipeRow`, `RecipeInsert`, `RecipeUpdate` 등 정의(필요 시 supabase gen types 참조)
- `schema.ts`: Zod로 입력 검증(제목/요약/태그 길이, 이미지 URL 등)
- `repository.ts`: Supabase 쿼리 전용 계층(RLS 전제)
  - `list({ limit, cursor, tag, status })`
  - `get(id: string)`
  - `create(input: RecipeInsert)`
  - `update(id: string, patch: RecipeUpdate)`
  - `remove(id: string)`
- `service.ts`: 비즈니스 규칙/후처리/레거시 매핑(orchestration)
  - 작성자 검증, `legacy_id`/`id_text_old` 대응(필요 시), 태그 정규화 등
- `ui/*`
  - `RecipeList.tsx`: 서버 컴포넌트 — SSR 목록 표시(읽기 전용)
  - `RecipeForm.tsx`: 클라 컴포넌트 — 입력만 담당, 서버액션 호출
  - `RecipeCard.tsx`: 프레젠테이션 전용

검증
- Repository 단위 테스트: SELECT/INSERT/UPDATE/DELETE happy path + 권한 거부 path
- Service 규칙: 타 사용자 리소스 수정 차단, 입력 검증 실패 시 에러 반환

체크리스트
- [ ] SELECT는 누구나, 변이는 인증 사용자만 정책 충족 시 허용(RLS로 보장)
- [ ] 커서 페이지네이션 정렬 일관성(`created_at desc, id asc` 등)
- [ ] 필요한 인덱스 존재(검색/정렬 필드)

---

## 3) app/recipes — 라우트 + 서버액션

목적
- App Router에서 SSR/서버액션으로 RLS 친화적인 데이터 흐름을 구현한다.

구현(요약)
- `page.tsx` (/recipes): 서버 컴포넌트로 `repository.list` 호출 → SSR 목록
- `new/page.tsx`: `RecipeForm` 렌더 + 서버액션 `create`
- `[id]/page.tsx`: `repository.get` 렌더 + 수정/삭제 버튼(서버액션 연결)
- `actions.ts`: `create/update/remove` 서버액션 — `lib/supabase/server`로 세션 전파된 클라이언트 사용

검증
- 비로그인: 목록만 가능, 변이 버튼/액션은 거부 또는 로그인 유도
- 로그인: 작성/수정/삭제 성공, 본인 리소스 외 변이 시 거부
- SSR 캐시 전략(선택): 변이 후 목록 재검증(`revalidateTag('recipes')` 등) 동작 확인

체크리스트
- [ ] 클라 컴포넌트는 직접 DB 호출 금지(반드시 서버액션)
- [ ] 에러 메시지/리다이렉트 UX 최소 구성

---

## 4) middleware (선택) — 인증/쿠키 보강

목적
- 특정 경로 보호, SSR 쿠키 초기화, 간단한 보안 리다이렉트를 수행한다.

구현(예시)
- 인증이 필요한 경로 보호: `/recipes/new` 등 비로그인 접근 시 로그인 페이지로 리다이렉트
- Supabase 쿠키 초기화/갱신(필요 시 `@supabase/ssr` 또는 헬퍼 사용)

검증
- 비로그인 사용자가 보호 경로 접근 시 적절히 리다이렉트되는지
- 세션 갱신 시 쿠키가 정상 반영되는지

체크리스트
- [ ] 미들웨어는 꼭 필요한 범위에만 적용(과도한 전역 처리 지양)
- [ ] 서버액션/페이지의 권한 체크와 중복되지 않게 설계

---

마무리
- 위 4파트가 완료되면, `legacy/adapters/recipe.adapter.ts`를 Supabase repository로 내부 위임 변경 → 사용처 제거가 끝나면 `legacy/*` 정리.
- 진행 중 문제/변경 사항은 본 파일에 체크리스트 항목 추가로 관리.
