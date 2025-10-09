# 저장소 가이드라인 (Repository Guidelines)

## 프로젝트 구조 & 모듈 구성
- `src/app`: Next.js 14 App Router (layouts, pages, loading).
- `src/components`: 재사용 가능한 UI 및 내비게이션 컴포넌트.
- `src/features`: 도메인 모듈(`recipe`, `user`, `post`, `comment`). 각 모듈은 `api`, `repository`, `service`, `schema`, `types`를 포함.
- `src/lib`: 인증, Firebase, Supabase 관련 헬퍼. 공용 타입은 `src/types`에 둠.
- `public/`: 정적 자산. 컴포넌트에서 import하여 쓰는 이미지는 `src/assets/`에 위치.
- `tools/`: DB 유틸리티 및 마이그레이션(`tools/migrations/migrate.ts`).
- `supabase/`: SQL, 마이그레이션, 로컬 설정. **생성된 SQL은 직접 수정하지 말 것.**

## 빌드·테스트·개발 명령어
- `npm run dev` — 로컬 Next.js 개발 서버 실행
- `npm run build` — 프로덕션 빌드 생성
- `npm start` — 빌드된 앱 실행
- `npm run lint` — ESLint 검사(Next core web vitals)
- `npm run migrate:dry` — 적용 전 DB 변경 사항 미리보기: `cross-env DRY_RUN=1 tsx tools/migrations/migrate.ts`
- `npm run migrate` — DB 변경 사항 적용
- `npm run supabase:list-users` — Supabase SDK로 사용자 목록 조회

## 코딩 스타일 & 네이밍 규칙
- 신규 코드는 TypeScript 권장(기존 JS와 공존 가능).
- Prettier: `semi: true`, `singleQuote: false`, `tabWidth: 2`, `printWidth: 100`, `trailingComma: es5`.
- ESLint: `next/core-web-vitals` 확장 사용; `@next/next/no-img-element` 비활성화.
- 파일명: 컴포넌트/유틸은 `kebab-case` 사용(예: `user-nav.server.tsx`, `button.tsx`).
- React 컴포넌트 export는 `PascalCase`, 훅은 `useCamelCase` 사용.

## 테스트 가이드라인
- 현재 유닛 테스트 러너 미구성. 추가 시 Vitest 또는 Jest 권장.
- 테스트 파일은 모듈 근처에 `*.test.ts`/`*.test.tsx`로 두거나 `__tests__/`에 배치.
- 테스트는 빠르고 결정적이어야 하며, 네트워크/SDK(Supabase/Firebase)는 목(mock) 처리.

## 커밋 & PR 가이드라인
- 커밋 메시지: 명령형, 간결한 제목(<= 72자). 예 `feat(recipe): add like toggle service`
- 이슈 참조: 본문에 `Refs #123` 또는 `Fixes #123` 표기.
- PR: 목적, 스크린샷(UI), 마이그레이션 노트, 배포(롤아웃) 단계를 포함하고 관련 이슈 링크 첨부.
- `npm run lint`와 로컬 빌드 통과 필수; 필요 시 DB 마이그레이션 diff 포함.

## 보안 & 설정
- 시크릿은 `.env`/`.env.local`에 보관(커밋 금지). Supabase/Firebase 필수 환경변수는 `src/lib/**`에서 읽음.
- `supabase/sql` 산출물은 수동 편집 지양; 가능하면 `tools/migrations`를 통해 변경.
- 사용자 입력은 `features/*/schema.ts`의 zod 스키마로 검증.
