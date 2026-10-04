-- 게시글 검색(제목·본문 부분 일치)에 trigram 색인을 붙인다.
--
-- 통합 검색은 "title ilike '%검색어%' or content_text ilike '%검색어%'"로 게시글을 찾는다.
-- 앞에 %가 붙은 부분 일치는 일반 색인을 쓸 수 없어서, 매번 게시글 전체를 읽었다.
-- 부하 테스트에서 이 쿼리가 DB 시간의 75%를 차지했다(첫 쪽 조회와 총 개수 세기로 한 요청에 두 번 실행).
--
-- trigram 색인은 글을 세 글자씩 겹쳐 잘라 "이 조각이 어느 글에 있는지"를 적어 둔다.
-- 로컬 더미 5,000개 기준, 세 글자 이상이고 드문 검색어는 약 45ms → 1ms 안팎으로 줄었다.
-- 한계: 두 글자 검색어(예: 김치)는 세 글자 조각을 만들 수 없어 여전히 전체를 읽고,
-- 대부분의 글에 들어 있는 흔한 단어는 색인보다 전체 읽기가 빨라 DB가 색인을 쓰지 않는다.

create index idx_posts_title_trgm
  on public.posts using gin (title extensions.gin_trgm_ops);

create index idx_posts_content_text_trgm
  on public.posts using gin (content_text extensions.gin_trgm_ops);

comment on index public.idx_posts_title_trgm is
  '게시글 제목 부분 일치 검색(ilike ''%검색어%'')용 trigram 색인. 두 글자 검색어에는 쓰이지 않는다.';
comment on index public.idx_posts_content_text_trgm is
  '게시글 본문 텍스트 부분 일치 검색(ilike ''%검색어%'')용 trigram 색인. 두 글자 검색어에는 쓰이지 않는다.';
