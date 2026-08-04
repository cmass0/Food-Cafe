# 커뮤니티 게시글 작성 폼 개편 및 DB 연동 매뉴얼

## 목표

커뮤니티 게시글 작성 화면을 shadcn/ui 규격으로 개편하고, 작성자·본문·카테고리 데이터가 서버와 Supabase에서 일관되게 검증되도록 만든다.

이 작업은 화면부터 시작하지 않는다. 데이터 계약과 권한을 먼저 고정한 뒤, 서버 액션과 폼 UI를 연결한다.

## 1. 작성 데이터 계약 확정

일반 사용자가 입력하는 값은 아래 세 가지로 제한한다.

| 항목 | 입력 방식 | 저장 필드 | 검증 주체 |
| --- | --- | --- | --- |
| 카테고리 | 드롭다운 | `category` | 서버 + DB |
| 제목 | 텍스트 입력 | `title` | 서버 + DB |
| 본문 | Lexical 에디터 | `content_json` | 서버 |

다음 값은 폼에서 받지 않는다.

| 필드 | 생성 또는 결정 위치 |
| --- | --- |
| `content_html` | 서버가 `content_json`에서 생성 후 sanitize |
| `content_text` | 서버가 `content_json`에서 검색용 텍스트로 생성 |
| `writer_uid` | 서버의 로그인 사용자 ID |
| `writer_name` | 서버가 로그인 사용자 프로필에서 결정 |
| 조회수·좋아요·댓글 수 | DB 기본값 또는 별도 기능 |

권장 사용자 카테고리는 `free`, `recipe_tip`, `question`, `review`이다. 공지와 이벤트는 일반 사용자 카테고리가 아닌 관리자 전용 상태로 분리한다.

> 현재의 자유 입력 `type`은 카테고리 드롭다운으로 대체한다. 사용자 입력 문자열을 그대로 저장하면 목록 필터와 상세의 같은 게시판 목록이 어긋날 수 있다.

### 컬럼 전략 결정

기존 `type` 컬럼을 재활용하지 않고 신규 `category` 컬럼을 사용한다.

- 신규 코드의 도메인 모델과 URL 파라미터는 모두 `category`를 사용한다.
- 마이그레이션 기간에만 기존 `type`을 백필 원본으로 사용한다.
- 배포 및 데이터 검증이 끝난 뒤 별도 정리 마이그레이션에서 `type`을 제거한다.
- 과도기에도 신규 쓰기는 `category`에만 수행한다.

## 2. Supabase schema 및 RLS 적용

Supabase를 resume한 뒤 UI 작업보다 먼저 migration을 적용한다.

1. `posts.category` 컬럼을 nullable 상태로 추가한다.
2. 기존 `type` 값을 다음 규칙으로 `category`에 백필한다.
   - `board`, `free`, `자유` → `free`
   - `info`, `recipe_tip`, `정보`, `레시피 팁` → `recipe_tip`
   - `question`, `qna`, `질문`, `질문&답변` → `question`
   - `review`, `후기`, `후기게시판` → `review`
   - `NULL`, 빈 문자열, 위 규칙에 없는 임의 문자열 → `free`
3. `category`는 `NOT NULL`과 허용 값 제한(enum 또는 check constraint)을 둔다.
4. 목록 성능을 위해 `(category, created_at, id)` 인덱스를 추가한다.
5. 타입 생성 파일을 갱신한다.

백필 이후 아래 값이 모두 0건인지 확인한 뒤 `NOT NULL`과 check constraint를 적용한다.

- `category IS NULL`
- `category NOT IN ('free', 'recipe_tip', 'question', 'review')`

RLS는 아래 조건을 만족해야 한다.

- 로그인 사용자만 insert할 수 있다.
- insert의 `writer_uid`는 반드시 `auth.uid()`와 같아야 한다.
- update/delete는 원글의 `writer_uid`가 `auth.uid()`와 같을 때만 허용한다.
- update 이후에도 `writer_uid`를 다른 사용자로 바꿀 수 없어야 한다.

폼의 로그인 체크는 UX일 뿐 보안 장치가 아니다. API나 Supabase 직접 요청을 우회해도 RLS와 서버 검증이 동일하게 동작해야 한다.

## 3. 도메인 스키마와 서버 액션 변경

대상 파일은 다음과 같다.

- `src/domain/post/schema.ts`
- `src/domain/post/types.ts`
- `src/domain/post/service.ts`
- `src/domain/post/repository.ts`
- `src/app/posts/actions.ts`

카테고리 rename 및 UI 연동 대상 파일은 다음과 같다.

- `src/domain/post/ui/PostForm.tsx` — 자유 입력 `type`을 카테고리 `Select`로 변경
- `src/app/posts/page.tsx` — 카테고리 상수와 `category` URL 파라미터 사용
- `src/app/posts/[id]/page.tsx` — 상세 하단 목록을 `post.category` 기준으로 조회
- `src/domain/post/ui/PostList.tsx` — 상세 링크에 `category`·페이지 문맥 유지
- `src/domain/post/ui/PostDetail.tsx` — 상세 카테고리 라벨 표시
- `src/domain/post/ui/postType.ts` — 단일 카테고리 라벨 매핑으로 교체
- `src/app/posts/components/PostCategorySelect.client.tsx` — `category` query 사용
- `src/app/posts/components/PostBoardToolbar.client.tsx` — 게시판 검색 시 `category` query 사용
- 기존 `?type=...` URL 진입 경로 — 읽기 시 새 값으로 정규화해 하위 호환

서버 액션은 `title`, `category`, `content_json`만 받고 아래 순서로 처리한다.

1. `supabase.auth.getUser()`로 로그인 사용자를 확인한다.
2. 카테고리를 enum으로 검증한다.
3. 제목 길이와 Lexical JSON 크기를 검증한다.
4. 빈 본문을 거절한다.
5. `content_json`으로부터 `content_html`과 `content_text`를 서버에서 생성한다.
6. HTML은 allowlist 기반 sanitize를 거친다.
7. 작성자 ID와 이름은 서버에서 채운다.
8. 임시 이미지 URL은 작성자·게시글 ID 기준의 최종 경로로 이동한다.
9. 수정과 삭제는 repository의 `writer_uid` 조건까지 포함한다.

현재 게시글의 HTML 생성·sanitize와 YouTube 링크 카드 변환은 유지한다. 특히 `content_html`을 클라이언트가 보내게 하면 안 된다.

## 4. 작성 폼 UI 구현

대상 파일은 `src/domain/post/ui/PostForm.tsx`다.

shadcn/ui 컴포넌트로 아래 구조를 사용한다.

```text
Card
├─ CardHeader: 게시글 작성 / 안내 문구
└─ CardContent
   ├─ 제목 Input
   ├─ 카테고리 Select
   ├─ Lexical 에디터
   └─ 오류 메시지와 글자 수

하단 액션
├─ 취소
└─ 등록 또는 수정
```

서버 액션을 유지하는 경우 Radix 기반 shadcn `Select` 값은 클라이언트 상태로 관리하고, 제출 시 hidden input으로 전달한다. hidden input은 전송용일 뿐이므로 서버에서 반드시 다시 검증한다.

폼에는 다음 UX를 포함한다.

- 제목 최대 150자 카운터
- 카테고리 미선택 오류
- 에디터 빈 본문 오류
- pending 상태의 등록/수정 버튼
- 서버 액션 오류를 보여 주는 `role="alert"` 영역
- 취소 시 작성 내용 유실 확인 모달

## 5. 목록과 상세 연동

카테고리 값은 아래 모든 화면에서 같은 필드를 사용해야 한다.

```text
작성 폼
→ posts.category 저장
→ 커뮤니티 카테고리 드롭다운
→ 게시글 상세의 현재 게시판 이름
→ 상세 하단 같은 게시판 목록
→ 검색·페이지네이션 query
```

상세 하단 목록은 현재 게시글의 `category`와 `listPage`를 기준으로 조회한다. 현재 보고 있는 게시글은 목록에서 활성 행으로 표시한다.

## 6. 완료 기준

- 비로그인 사용자는 게시글을 작성할 수 없다.
- 다른 사용자의 글을 수정하거나 삭제할 수 없다.
- 요청을 조작해 `writer_uid`나 `writer_name`을 바꿀 수 없다.
- 허용되지 않은 카테고리는 저장되지 않는다.
- 빈 Lexical 본문은 저장되지 않는다.
- 단독 YouTube URL은 상세에서 썸네일 카드로 표시된다.
- 카테고리별 목록과 상세 하단 목록이 같은 기준으로 표시된다.
- 기존 `board` 게시글은 자유게시판으로 정상 노출된다.

## 권장 작업 순서

1. Supabase resume 및 RLS 활성화·정책 확인
2. category migration과 기존 데이터 백필
3. post schema·service·server action 개편
4. PostForm shadcn UI 개편
5. 목록·상세·검색의 category 연동
6. 두 사용자 계정으로 권한 테스트
7. YouTube 카드와 이미지 업로드 회귀 테스트

## 적용 기록 (2026-07-30)

- [x] `posts.category` 컬럼 추가 및 기존 `type` 값 백필
- [x] `NOT NULL`, 허용 값 check constraint, `(category, created_at, id)` 인덱스 적용
- [x] 백필 검증: `NULL` 카테고리 0건, 허용 범위 밖 카테고리 0건
- [x] `posts` RLS 활성화 확인
- [x] insert는 로그인 사용자 본인(또는 관리자), update/delete는 원글 작성자(또는 관리자) 정책 확인
- [x] Supabase TypeScript 타입 갱신
- [x] 서버에서 `content_html`과 `content_text` 생성
- [x] PostForm을 shadcn/ui 카테고리 선택 폼으로 개편
- [x] 목록·상세·검색·페이지네이션을 `category` 기준으로 전환
- [x] 기존 `?type=board|info|question|review` 링크 정규화 호환
- [x] 백필 원본으로만 남겨 둔 `posts.type` 컬럼 및 예전 `idx_posts_type` 인덱스 제거
- [ ] 두 사용자 계정을 이용한 실제 브라우저 권한 시나리오 테스트
- [ ] 실제 게시글 작성으로 이미지 업로드 및 YouTube 카드 최종 회귀 테스트

> 마지막 두 항목은 테스트용 로그인 계정과 실제 업로드 동작이 필요한 수동 검증 항목이다.
