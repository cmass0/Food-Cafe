
supabase/
└─ sql/
   ├─ 0007_comments_align_with_posts.sql      # comments 컬럼 표준화 + 인덱스 + (선택) posts.comment_count 트리거 + RLS 재정의
   └─ 0008_comments_count_backfill.sql         # (선택) 과거 데이터로 posts.comment_count 재계산 스크립트

src/
├─ types/
│  └─ supabase.ts                              # (수정) 0007 적용 후 supabase gen types 로 재생성되는 타입 정의

├─ features/
│  └─ comment/
│     ├─ schema.ts                             # (신규) 댓글용 zod 스키마: list/create/update 검증
│     ├─ types.ts                               # (신규) DB Row ↔ 도메인 모델 매핑, 커서/리스트 타입
│     ├─ repository.ts                          # (신규) Supabase 쿼리 계층(목록/단건/생성/수정/삭제, 커서 OR 조건)
│     ├─ service.ts                             # (신규) 인증확인(getUser), zod 검증, 커서 페이징, writerName 파생
│     ├─ api.ts                                 # (신규) 브라우저 fetch 래퍼(GET/POST/PUT/DELETE)
│     └─ ui/
│        ├─ CommentThread.client.tsx            # (신규) 공용 스레드 UI(shadcn) — parentType/parentId 기반
│        ├─ PostComments.client.tsx             # (신규) 게시글 전용 얇은 래퍼(UI 문구만 다름)
│        └─ RecipeComments.client.tsx           # (신규) 레시피 전용 얇은 래퍼(UI 문구만 다름)

├─ app/
│  └─ api/
│     └─ comments/
│        ├─ route.ts                            # (신규) GET(list)/POST(create) — 서버 세션 + RLS 전제
│        └─ [id]/
│           └─ route.ts                         # (신규) PUT(update)/DELETE(remove) — 소유자만 조작

├─ features/
│  ├─ post/
│  │  └─ ui/
│  │     └─ PostDetail.tsx                      # (수정) <PostComments postId={post.id} /> 장착
│  └─ recipe/
│     └─ ui/
│        └─ RecipeDetail.tsx                    # (수정) <RecipeComments recipeId={recipe.id} /> 장착

└─ lib/
   └─ supabase/
      └─ server.ts                              # (기존) getServerSupabase() — 서버측 세션 생성 유틸