# User 도메인 Supabase 마이그레이션 매뉴얼

Firebase → Supabase 이전이 아직 남아 있는 User 도메인 작업을 5개의 단계로 나눴습니다. 순서대로 진행해야 서로 의존성이 맞습니다.

---

## Part 0 · 현재 상태 점검
- “자기 자신” 프로필 흐름은 이미 Supabase 경로(`src/features/user/repository.ts`, `src/app/auth/auth-context.tsx`)로 동작합니다.
- 아직 Firebase에 의존하는 영역
  - `src/app/api/users/...` 하위 API 라우트
  - Firebase 전용 레포지토리 `src/features/user/repository.server.ts`
- Supabase 스키마(`supabase/sql/0001_init_core.sql`)에는 `public.users` 테이블과 RLS 정책이 정의돼 있으니 Firestore 대신 이를 활용합니다.

---

## Part 1 · Supabase 타입 및 유틸 준비
1. Supabase 타입 최신화  
   `npx supabase gen types typescript --project-id vtkcngubofjqddqvcufp --schema public > src/types/supabase.ts`
2. 생성된 타입을 활용한 도메인 전용 타입 헬퍼(선택)
   ```ts
   // src/features/user/types.supabase.ts
   import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";
   export type UserRow = Tables<"users">;
   export type UserInsert = TablesInsert<"users">;
   export type UserUpdate = TablesUpdate<"users">;
   ```
3. Firebase 시절 필드(`username`, `likerecipe` 등)를 Supabase에서 어떻게 다룰지 결정  
   - `public.users`에 컬럼을 추가한다.
   - 사용자 설정/좋아요 등을 별도 테이블로 분리한다(`user_preferences`, `user_likes` 등).
   - UI를 새 스키마에 맞춰 수정한다.

**결과물:** Supabase 레포 작업에 바로 쓸 수 있는 타입/매핑 방안 문서화

---

## Part 2 · Supabase 레포지토리 구현(Self + Admin)
새 레포지토리 모듈(e.g. `src/features/user/repository.supabase.ts`)을 만들고 아래를 담습니다.
1. `getSelf` / `updateSelf`
   - 기존 `repository.ts`와 통합하거나 새 모듈에서 래핑
2. `listUsers`, `getUser`, `createUser`, `updateUser`, `deleteUser`
   - Supabase 쿼리로 구현
   - 서버 컨텍스트에서는 `createServerSupabase` 사용
   - RLS 정책(`users_insert_self_or_admin` 등)를 고려한 파라미터 처리
   - Part 1에서 정한 스키마 매핑 적용(예: 보조 테이블)
3. 커서 기반 페이지네이션, 검색 등 기존 Firebase API에서 제공하던 기능 반영

**결과물:** CRUD 전체를 제공하는 Supabase 레포. 가능하면 단위/통합 테스트 작성

---

## Part 3 · API 라우트를 Supabase로 전환
1. `src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts`에서 Firebase 레포(`repository.server.ts`) 대신 Supabase 레포를 사용
2. 요청/응답 포맷은 기존과 동일하게 유지(프론트 영향 최소화)
3. 필요 시 검증 스키마 업데이트 또는 삭제
4. 확인할 API
   - `GET /api/users?limit=…&cursor=…`
   - `GET /api/users/[id]`
   - `POST /api/users` (관리자/콜백에 따른 프로비저닝)
   - `PUT /api/users/[id]`
   - `DELETE /api/users/[id]`

**결과물:** 모든 /api/users 경로가 Supabase 데이터만 읽고 쓰도록 전환

---

## Part 4 · UI & 클라이언트 로직 정리
1. Firebase에 묶여 있는 UI 훅/컴포넌트 점검(e.g. `react-firebase-hooks` 사용 부분)
2. Firebase 훅을 Supabase 컨텍스트(예: `useAuth`)로 교체
3. 클라이언트 유틸(`features/user/api.ts`), 프로필/관리자 화면을 새 API 결과에 맞게 보정
4. 수동 시나리오 점검: 로그인, 프로필 편집, 유저 목록/삭제 등

**결과물:** 사용자 화면이 전부 Supabase API + Supabase 세션 컨텍스트로 동작

---

## Part 5 · 마무리 정리
1. 사용되지 않는 Firebase 전용 모듈 제거
   - `src/features/user/repository.server.ts`
   - Supabase로 대체된 헬퍼 함수
2. 다른 도메인도 모두 Supabase로 이전했다면 `package.json`에서 Firebase 관련 패키지 삭제
3. README/문서에 마이그레이션 완료 내용 반영
4. 선택: 삭제 전에 백업 브랜치/태그 생성

**결과물:** User 도메인에서 Firebase 의존성 완전 제거

---

## 체크리스트 & 테스트
- [ ] Supabase 레포 쿼리 단위 테스트
- [ ] API 라우트 통합 테스트(성공/에러 케이스 모두)
- [ ] 수동 QA: 회원가입/로그인, 프로필 수정, 유저 목록 확인, 관리자 삭제 등
- [ ] RLS 정책 검증(본인만 수정 가능, 비관리자 제한 등)
- [ ] Firestore 인덱스/규칙/스케줄 작업 등 User 컬렉션 관련 항목 정리

위 과정을 끝내면 User 도메인은 Firebase에서 완전히 분리되고, Supabase 기반으로 안정적으로 동작하게 됩니다.
