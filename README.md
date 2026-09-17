# FoodCafe

레시피와 음식 조합을 발견하고, 요리 경험을 게시글로 공유하는 커뮤니티 서비스입니다.

단순한 CRUD 구현을 넘어 인증·소유권, 사용자 반응 집계, 검색과 트렌딩, 이미지 생명주기, 실패 격리와 자동화 테스트까지 실제 서비스에서 필요한 흐름을 구현하는 데 초점을 맞췄습니다.

> 배포 주소는 Vercel 배포 후 이 위치에 추가합니다.

## 핵심 기능

- **콘텐츠 발견**: 인기·신규 레시피, 음식 조합, 커뮤니티 글, 트렌딩 태그와 기간별 랭킹
- **통합검색**: 레시피·조합·게시글을 한 화면에서 검색하고 섹션별 정렬·페이지 상태 유지
- **콘텐츠 작성**: 레시피와 조합 작성·수정·삭제, Lexical 기반 게시글 에디터와 이미지 첨부
- **커뮤니티 반응**: 좋아요, 북마크, 댓글, 팔로우·팔로워 목록, 팔로잉 사용자 멘션
- **인증 흐름**: 모달 로그인, 원래 페이지 복귀, 보호 경로 가드, 비밀번호 복구
- **공유와 오류 처리**: 카카오 공유, URL 복사 대체 동작, 공통 오류·로딩·404 화면
- **반응형·접근성**: 모바일 카드와 페이지네이션, 키보드 포커스, 접근성 이름과 터치 영역

## 구현에서 중점적으로 다룬 문제

### 인증과 권한

- Next.js Proxy에서 작성·수정 화면 진입 전 인증 상태를 확인합니다.
- 작성자와 관리자의 수정·삭제 권한을 서버와 Supabase RLS 양쪽에서 제한합니다.
- 외부 URL로 이동할 수 없는 안전한 로그인 복귀 경로만 허용합니다.
- 공개 프로필과 비공개 사용자 데이터를 분리해 필요한 정보만 노출합니다.

### 데이터 무결성

- 좋아요·북마크·팔로우처럼 중복 요청에 민감한 동작은 Postgres RPC와 제약조건으로 보호합니다.
- 댓글과 사용자 반응 카운터는 Trigger로 원본 행과 집계값을 함께 유지합니다.
- 트렌딩 RPC는 기간과 동점 정렬 기준을 고정해 동일한 입력에 일관된 순서를 반환합니다.

### 이미지 생명주기

- DB에는 전체 공개 URL 대신 Storage 상대 경로를 저장합니다.
- 화면에 표시할 때 프로젝트 URL과 버킷 설정을 기준으로 공개 URL을 조합합니다.
- 업로드 실패 시 생성된 파일을 정리하고, 콘텐츠 삭제 시 연결된 이미지도 함께 제거합니다.
- Vercel Cron이 참조되지 않는 Storage 객체를 정리할 수 있으며 dry-run을 지원합니다.

### 장애 격리

- 홈과 통합검색은 한 영역의 조회 실패가 다른 영역까지 중단시키지 않도록 독립적으로 로드합니다.
- 잘못된 상세 ID는 내부 DB 오류 대신 404로 처리합니다.
- SDK 로딩 실패와 공유 실패는 공통 오류 모달과 URL 복사 대체 동작으로 안내합니다.

## 기술 스택

| 영역         | 기술                                                |
| ------------ | --------------------------------------------------- |
| 애플리케이션 | Next.js 16 App Router, React 19, TypeScript         |
| UI           | Tailwind CSS 4, shadcn/ui, Radix UI, Lucide         |
| 폼·검증      | React Hook Form, Zod                                |
| 에디터       | Lexical                                             |
| 데이터·인증  | Supabase Postgres, Auth, Storage, RLS, RPC, Trigger |
| 단위 테스트  | Vitest, Testing Library                             |
| E2E 테스트   | Playwright                                          |
| DB 테스트    | Supabase CLI, pgTAP                                 |
| 배포         | Vercel, Vercel Cron                                 |

## 프로젝트 구조

```text
src/
├─ app/                 Next.js 라우트, Server Action, 화면 전용 UI
├─ components/          여러 화면이 공유하는 UI와 기능 컴포넌트
├─ domain/              도메인 모델, 서비스, 저장소, 순수 규칙
├─ features/            화면을 넘어 재사용되는 기능 단위 로직
├─ lib/                 인증·Supabase·Storage 등 인프라 유틸
└─ types/               생성된 Supabase 타입과 공통 타입

e2e/                    Playwright 사용자 흐름 테스트
supabase/
├─ migrations/          스키마·RLS·RPC·Trigger 변경 이력
└─ tests/database/      View·RLS·RPC·Trigger pgTAP 테스트
```

## 로컬 실행

### 요구사항

- Node.js 24
- npm
- 로컬 Supabase를 사용할 경우 Docker Desktop과 Supabase CLI

### 설치

```bash
git clone https://github.com/cmass0/Food-Cafe.git
cd Food-Cafe
npm install
```

`.env.example`을 참고해 `.env.local`을 작성합니다. Supabase 로컬 환경을 사용한다면 다음 명령으로 시작할 수 있습니다.

```bash
npx supabase start
npm run dev
```

애플리케이션은 기본적으로 `http://localhost:3000`에서 실행됩니다. 로컬 Supabase Studio 주소는 `supabase start` 결과에서 확인할 수 있습니다.

## 환경변수

| 변수                                  | 용도                              | 공개 여부          |
| ------------------------------------- | --------------------------------- | ------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`            | Supabase 프로젝트 URL             | 브라우저 공개 가능 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | RLS가 적용되는 공개 클라이언트 키 | 브라우저 공개 가능 |
| `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET` | 이미지 Storage 버킷명             | 브라우저 공개 가능 |
| `NEXT_PUBLIC_BASE_URL`                | 메타데이터와 공유 URL 기준 주소   | 브라우저 공개 가능 |
| `NEXT_PUBLIC_KAKAO_JS_KEY`            | 카카오 JavaScript SDK 키          | 브라우저 공개 가능 |
| `SUPABASE_SERVICE_ROLE_KEY`           | 서버의 Storage 정리 작업          | **서버 전용**      |
| `CRON_SECRET`                         | 내부 Storage 정리 API 인증        | **서버 전용**      |
| `STORAGE_CLEANUP_DRY_RUN`             | 실제 삭제 없이 정리 후보만 확인   | 서버 전용          |

`service_role` 키와 `CRON_SECRET`에는 절대 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다. 실제 비밀값은 Git에 커밋하지 않습니다.

## 테스트

```bash
npm test             # Vitest 단위 테스트
npm run test:db      # 로컬 Supabase pgTAP 테스트
npm run test:e2e     # Playwright E2E 테스트
npm run test:e2e:ui  # Playwright UI 모드
npm run lint         # ESLint
```

- Vitest: 28개 테스트 파일, 229개 테스트 통과
- Playwright: 공개 탐색, 인증, CRUD, 권한, 검색, 공유, 소셜 동작, 접근성을 포함한 50개 시나리오
- 역할별 E2E는 작성자·다른 사용자·관리자 계정과 격리된 테스트 DB가 필요합니다. 계정이 없는 환경에서는 해당 시나리오만 건너뜁니다.
- DB 테스트는 운영 DB가 아닌 로컬 Supabase에서만 실행합니다.

## Vercel 배포

1. 저장소를 Vercel 프로젝트에 연결합니다.
2. `.env.example`을 기준으로 운영 환경변수를 등록합니다.
3. `NEXT_PUBLIC_BASE_URL`을 실제 Vercel 주소로 설정합니다.
4. Supabase Auth의 Site URL과 Redirect URL에 다음 주소를 등록합니다.

```text
https://<배포주소>
https://<배포주소>/auth/callback
```

5. 배포 후 로그인, 콘텐츠 조회·작성, 이미지 표시와 공유 기능을 확인합니다.

로컬 Supabase 주소인 `127.0.0.1`은 Vercel에서 접근할 수 없으므로 배포 환경에는 실제 Supabase 프로젝트 URL과 키를 사용해야 합니다.
