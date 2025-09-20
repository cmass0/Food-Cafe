# Firebase → Supabase 데이터 변경 계획

## 0. 목표 요약
- Firestore 컬렉션(User, Post, Recipe, Comment)과 Firebase Storage/Authentication을 Supabase(Postgres + Auth + Storage)로 이전합니다.
- 기존 API 인터페이스(/api/*)와 프론트엔드 가드를 유지하면서, Postgres 스키마·RLS 정책·관계형 모델에 맞춰 데이터 정규화 및 불필요 필드를 정리합니다.

## 1. 새 테이블/뷰 추가 (Add)
- uth.users (Supabase 기본): Firebase UID → Supabase UID로 변환, 이메일/패스워드/소셜 로그인 이관.
- public.profiles
  - 컬럼: user_id uuid PK, username text, display_name text, email text, created_at timestamptz, updated_at timestamptz.
  - 비고: 기존 User 컬렉션의 핵심 필드를 저장, username 중복 체크 인덱스 생성.
- public.posts
  - id uuid, 	itle text, content text, uthor_id uuid references auth.users, uthor_name text, iew_count int, order_no int, category text, created_at, updated_at.
  - 비고: Firestore 
umber → order_no, check → iew_count, 	ype → category.
- public.recipes
  - id uuid, 	itle text, summary text, ody text, image_url text, uthor_id uuid, uthor_name text, uthor_email text, like_count int, iew_count int, last_liked_at timestamptz, created_at, updated_at.
  - 비고: Firestore ecipe → ody, 
ame → uthor_name 레거시 보관.
- public.comments
  - id uuid, ody text, uthor_id uuid, uthor_name text, 	arget_type text, 	arget_id uuid, created_at, updated_at.
  - 비고: Firestore 	ype 값이 게시글/레시피 ID로 혼합되어 있어 	arget_type(post/ecipe) + 	arget_id로 분리 권장.
- public.user_recipe_likes
  - user_id uuid, ecipe_id uuid, liked_at timestamptz default now().
  - 비고: Firestore User.likerecipe 배열을 정규화, ecipes.like_count는 count(*) 또는 트리거로 관리.
- public.recipe_images (선택)
  - 여러 이미지를 저장해야 할 경우를 대비한 별도 테이블. 현재는 대표 이미지 1개이므로 생략 가능.

## 2. 기존 필드 매핑 및 변경 (Change)
- User
  - id → profiles.user_id (Supabase UID와 동일해야 하므로 UID 매핑 테이블 필요).
  - username → profiles.username (UNIQUE).
  - email → profiles.email.
  - likerecipe 배열 → user_recipe_likes로 분해.
  - date/createdAt/updatedAt → created_at/updated_at (UTC timestamptz).
- Post
  - id → posts.id (uuid, Firestore 문서 ID를 그대로 사용하거나 새 UUID 생성 후 매핑 저장).
  - writer/writerName → posts.author_name; writerUid → posts.author_id.
  - content HTML → posts.content (text, 필요시 	ext + content_html 컬럼 분리).
  - 
umber → order_no (정렬을 위해 유지, 필요 시 sequence 로 대체).
  - check → iew_count.
  - 	ype → category (oard 등 enum 값으로 제한 권장).
  - date/createdAt/updatedAt → 단일 created_at/updated_at.
- Recipe
  - 
ame/writerName → uthor_name.
  - like/likeCount → like_count (정수).
  - check/iewCount → iew_count.
  - ecipe → ody (markdown/text).
  - image → image_url.
  - lastlike/lastLikedAt → last_liked_at.
  - 	ype → category 또는 제거(기본값만 존재 시).
- Comment
  - comment → ody.
  - writer/writerName → uthor_name.
  - 	ype(문자열 ID) → 	arget_type + 	arget_id (문자열 ID를 그대로 uuid로 캐스팅하거나 TEXT 유지 후 FK 변환).
  - date/createdAt/updatedAt → created_at/updated_at.

## 3. 삭제/축소 대상 (Delete)
- Firestore 특유 필드: date(중복), id 내부 저장, writer(중복), like/check 구식 명칭.
- User.likerecipe 배열 구조 (관계형 테이블로 대체).
- Firebase Storage 경로 의존: Supabase Storage 버킷으로 이관 후 기존 URL 정리.
- irestore.rules, irebase.json(Firestore 섹션), Firebase SDK 초기화 코드(src/lib/firebase/*).
- 레거시 API 라우트(/api/comment, /api/post, /api/user JS 버전)는 새 Repo 레이어로 통합 후 제거.

## 4. 마이그레이션 작업 순서 제안
1. Supabase 프로젝트 생성 → Auth/S3 스토리지 설정 → .env에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 추가.
2. 위 스키마에 맞춰 SQL로 테이블/RLS 정책/인덱스 생성.
3. Firebase Auth 사용자 리스트 Export → Supabase Auth import (CSV/API). UID 매핑 테이블 유지.
4. Firestore 데이터 Export → 변환 스크립트 작성:
   - 타임스탬프 → ISO8601, 빈 필드 null 처리.
   - 	ype 값으로 댓글/게시글/레시피 매핑.
   - likerecipe 배열을 다대다 테이블 insert 배치로 분해.
5. Supabase Storage에 이미지 업로드(또는 기존 GCS URL 유지 시 퍼블릭 액세스 여부 검토).
6. API 레이어(/src/features/*/repository.server.ts)를 Supabase Query로 교체 후 테스트.
7. Frontend Auth/데이터 훅을 @supabase/supabase-js + @supabase/auth-helpers-nextjs로 전환, Firebase 의존 모듈 제거.
8. 불필요한 Firebase 관련 의존성 및 설정 파일 삭제.

## 5. 마이그레이션 체크포인트
- profiles.username UNIQUE 제약으로 인해 중복 닉네임 사전 정리 필요.
- Comment.type 필드에 게시글/레시피 외 다른 값이 있는지 검사(있다면 매핑 테이블 확장).
- Post.number 수동 증가 로직 → 시퀀스 or ow_number() 뷰로 대체 여부 결정.
- 좋아요/조회수 트리거 구현 (user_recipe_likes insert/delete 시 ecipes.like_count 갱신, 게시글/레시피 조회수는 API에서 iew_count increment).
- Supabase Storage 공개 정책: 레시피 썸네일은 퍼블릭 버킷, Quill 본문 삽입 이미지는 서명 URL 필요 여부 판단.

이 계획을 기반으로 데이터 변환 스크립트와 Supabase 스키마를 준비하면, 코드 리팩토링 시 필드 정합성과 RLS 정책 적용을 더 쉽게 검증할 수 있습니다.
