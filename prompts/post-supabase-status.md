# Post 도메인 Supabase 연동 현황 및 다음 단계

## 진행 현황 (완료)
- DB 마이그레이션 스크립트 추가: `supabase/sql/0004_posts.sql`
  - `posts` 테이블, 인덱스, RLS 정책(읽기 전체, 작성자만 수정/삭제), 조회수 증가 RPC 포함
- 도메인 레이어 구축
  - 타입/모델: `src/features/post/types.ts`
  - 유효성 스키마(Zod): `src/features/post/schema.ts`
  - 레포지토리(Supabase CRUD): `src/features/post/repository.ts`
    - 커서 기반 페이지네이션, 검색(title/writer_name ilike), 소유자 업데이트/삭제 가드
  - 서비스: `src/features/post/service.ts` (검증/권한 래핑, RPC 호출 포함)
- UI 컴포넌트(shadcn/tailwind 기반)
  - `PostList.tsx`, `PostForm.tsx`, `PostDetail.tsx` (라벨/문구 한글화, UTF 복구)
- 페이지 & 액션(SSR + Server Actions)
  - `/posts`: `src/app/posts/page.tsx`
  - `/posts/new`: `src/app/posts/new/page.tsx`
  - `/posts/[id]`: `src/app/posts/[id]/page.tsx`
  - 액션: `src/app/posts/actions.ts` (create/update/delete + revalidate)
- API 라우트 전환: `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`
- 레거시 Firebase 저장소 제거: `src/features/post/repository.server.ts`
- TypeScript 빌드 통과, 한글/UTF 텍스트 복구

## 다음 작업 (To‑Do)
- 마이그레이션 적용
  - `supabase db push`로 `0004_posts.sql` 반영, RLS/함수 권한 점검
- 데이터 이관
  - Firebase → Supabase 필드 매핑: `title/content/writerName/writerUid/type/number/view_count/timestamps`
  - 필요 시 임시 스크립트로 백필
- /commu 라우트 점진 전환
  - 목록/상세/작성/수정/삭제가 새 API/서비스를 사용하도록 연결
  - 조회수 증가: `PUT /api/posts/[id]` `{ checkIncrement: true }` 경로 재확인 및 UI 연결
  - 남아있는 한글 깨짐/문구 정리
- 권한/보안 체크
  - RLS + 서비스 레벨에서 “본인만 수정/삭제” 동작 검증
  - 작성자 표시 규칙(익명/표시명) 확정
- 테스트/UX
  - 수동 시나리오 체크(작성/수정/삭제/조회/페이지네이션/검색)
  - revalidate 범위/캐시 전략 확인, 에러/로딩 UI 일관화

## 빠른 검증 체크리스트
- [ ] `supabase db push` 완료 및 콘솔에서 RLS/함수 확인
- [ ] `/posts` 리스트/상세/작성/수정/삭제 정상 동작
- [ ] `/commu`에서도 조회/조회수 증가 정상 반영
- [ ] 비로그인 접근 제어 기대대로 동작

## 주요 파일 참조
- SQL: `supabase/sql/0004_posts.sql`
- 도메인: `src/features/post/{types.ts,schema.ts,repository.ts,service.ts}`
- UI: `src/features/post/ui/{PostList.tsx,PostForm.tsx,PostDetail.tsx}`
- 페이지: `src/app/posts/{page.tsx,new/page.tsx,[id]/page.tsx}`
- 액션: `src/app/posts/actions.ts`
- API: `src/app/api/posts/{route.ts,[id]/route.ts}`
