# Food Cafe 사이트 구조와 페이지 개요

## 1. 글로벌 구조
- src/app/layout.tsx는 App Router 루트 레이아웃으로, 전역 스타일(globals.css, eact-quill 테마)과 <Providers> 래퍼를 적용합니다.
- src/app/providers.tsx는 HeroUI 테마, AuthProvider(Firebase Auth 세션 관리), 전역 내비게이션(src/component/nav-bar.js)을 감쌉니다.
- 내비게이션 바는 검색(Next.js useRouter + /search), 테마 토글, 로그인 상태 표시 및 로그아웃(Firebase Auth)을 제공합니다.
- 전역 Auth 컨텍스트(src/app/context/Auth-context.js)는 Google 로그인 팝업, 이메일 로그인 후 Firestore User 문서 자동 생성, 세션 추적을 담당합니다.
- 전역 모달, 댓글, 포스트/레시피 카드 등은 src/component/* 하위에 분리되어 재사용됩니다.

## 2. 페이지 맵

### / (홈)
- 위치: src/app/page.js
- 콘텐츠: 메인 히어로(슬라이드쇼/CTA), 소개 섹션, 푸터 캐러셀.
- 상호작용: CTA 클릭 시 로그인 여부 검사 후 /meals/share로 라우팅(Firebase Auth).
- 데이터 의존: 실시간 데이터 사용 없음, 전역 Auth 상태만 활용.

### /login
- 위치: src/app/login/page.js
- 콘텐츠: 이메일/비밀번호 로그인 폼, "로그인 유지" 체크, Google 로그인 버튼.
- 데이터: Firebase Auth 이메일 로그인(eact-firebase-hooks), Auth-context의 googleLogin() 호출.
- 성공 시 세션 스토리지 플래그를 기록하고 홈으로 리디렉션.

### /signup
- 위치: src/app/signup/page.js
- 콘텐츠: 닉네임/이메일/비밀번호 등록 폼, 입력 검증 및 중복 확인.
- 데이터 흐름:
  - 닉네임 중복 체크: Firestore User 컬렉션 where 쿼리(src/Authlogic/nicknamecheck.js).
  - 가입 제출: /api/user POST → Firebase Admin Auth 사용자 + Firestore User 문서 생성.

### /commu
- 위치: src/app/commu/page.js
- 콘텐츠: 커뮤니티 게시글 테이블(src/component/postboard/postboard.js), 검색/페이지네이션 UI.
- 데이터: /api/posts GET → Firestore Post 컬렉션에서 최신순 100건 로드, 클라이언트에서 정렬/필터.
- 기능: 로그인 미완료 시 글쓰기 버튼 클릭 시 모달 경고.

### /commu/writeform
- 위치: src/app/commu/writeform/page.js
- 콘텐츠: ReactQuill 기반 게시글 작성 폼, 이미지 업로드.
- 데이터: Firebase Storage images/{timestamp} 업로드 → 다운로드 URL을 콘텐츠에 삽입, /api/posts POST(작성자 정보 포함).
- 권한: 로그인 필요(폼 마운트 시 사용자 정보 로딩, 미로그인 시 로딩 화면 유지).

### /commu/[commudetail]
- 위치: src/app/commu/[commudetail]/page.js
- 콘텐츠: 게시글 상세, 수정/삭제 버튼, 댓글 영역(CommentArea).
- 데이터 흐름:
  - /api/posts/[id] GET으로 게시글 로드.
  - 댓글: Comment 컬렉션에서 	ype=게시글ID로 조회.
  - 삭제 버튼 → /api/posts/[id] DELETE.

### /commu/[commudetail]/editform
- 위치: src/app/commu/[commudetail]/editform/page.js
- 콘텐츠: 기존 게시글 로딩 후 제목/본문 수정, 이미지 재업로드 가능.
- 데이터: /api/posts/[id] GET/PUT, Firebase Storage 업데이트.

### /meals
- 위치: src/app/meals/page.js
- 콘텐츠: 레시피 카드 그리드(Gridracipe), 정렬 탭(최신/좋아요/조회수).
- 데이터: /api/recipes GET(100건); 클라이언트에서 정렬 및 날짜 파싱.
- 권한: "레시피 공유" 버튼 클릭 시 로그인 요구.

### /meals/share
- 위치: src/app/meals/share/page.js
- 콘텐츠: 레시피 등록 폼(제목/요약/본문/이미지/작성자), 업로드 미리보기.
- 데이터: Firebase Storage 업로드 → URL 전달, /api/recipes POST. 작성자 이름은 이메일 로그인 사용자의 Firestore User.username 우선.

### /meals/[detail]
- 위치: src/app/meals/[detail]/page.js
- 콘텐츠: 레시피 상세, 좋아요 버튼, 수정/삭제, 댓글.
- 데이터 흐름:
  - /api/recipes/[id] GET으로 상세 로드.
  - 좋아요: Firestore User.likerecipe 배열에 레시피 ID 저장 후 /api/recipes/[id] PUT(likeCountIncrement).
  - 조회수 증가는 별도 API에서 관리(Recipe.check 필드 사용).
  - 댓글: Comment 컬렉션 	ype=레시피ID.

### /meals/[detail]/recipeedit
- 위치: src/app/meals/[detail]/recipeedit/page.js
- 콘텐츠: 레시피 수정 폼(이미지 교체 지원).
- 데이터: /api/recipes/[id] GET/PUT, Firebase Storage 재업로드.

### /search
- 위치: src/app/search/page.tsx 및 병렬 라우트 @posts, @meals.
- 콘텐츠: 검색 입력은 내비게이션에서 수행, 결과 페이지는 게시글/레시피 각각 렌더.
- 데이터: src/data/post.js, src/data/recipe.js의 Firestore Admin SDK를 사용하여 전체 목록을 가져온 뒤 키워드 필터.

### /ranking
- 위치: src/app/ranking/page.js
- 현재는 플레이스홀더 텍스트만 렌더.

## 3. API 라우트 요약
- /api/comments (oute.ts): Firestore Comment CRUD, 커서 기반 페이지네이션.
- /api/comments/[id]: 댓글 단건 조회/수정/삭제.
- /api/posts, /api/posts/[id]: 게시글 CRUD.
- /api/recipes, /api/recipes/[id]: 레시피 CRUD, 좋아요/조회수 증가 옵션.
- /api/users, /api/users/[id]: Firestore Admin 기반 사용자 목록/수정(구현),
- /api/user (oute.js): 회원 가입용 구 라우트(Firebase Admin Auth + Firestore User).
- /api/comment, /api/post: 레거시 JS 라우트가 병존(직접 Firestore Admin 호출).

## 4. Firestore 스키마 (현재)
### User
- 필드: id, email, username, likerecipe(레시피 ID 배열), date(Timestamp), createdAt/updatedAt(일부 문서만), 
ame(과거 데이터), 기타 등록 시점 값.
- 용도: 이메일 로그인 사용자 프로필 및 좋아요 추적.

### Post
- 필드: id, 	itle, content(HTML), writer/writerName, writerUid, 
umber(일련번호), check(조회수), 	ype(기본 oard), date 및 createdAt/updatedAt Timestamp.
- 관계: 댓글 	ype=PostID, 검색/정렬에 사용.

### Recipe
- 필드: id, 	itle, summary, ecipe(본문), image, email/writerEmail, 
ame/writerName, writerUid, like/likeCount, check/iewCount, lastlike/lastLikedAt, 	ype(기본 ecipe), date, createdAt, updatedAt.
- 기타: 좋아요 이력은 User.likerecipe, 조회수 증가는 check 필드 증분.

### Comment
- 필드: id, comment, writer/writerName, writerUid, 	ype(게시글 또는 레시피 ID), date, createdAt, updatedAt.
- 사용처: 커뮤니티/레시피 상세 페이지 댓글 스레드.

### Storage
- 경로: images/{timestamp}
- 용도: 게시글 및 레시피 본문/대표 이미지 업로드, URL을 본문에 삽입.

이 문서는 Firebase 기반 현 구조를 기준으로 한 페이지/데이터 맵이며, Supabase 마이그레이션 계획 수립의 Reference로 활용할 수 있습니다.
