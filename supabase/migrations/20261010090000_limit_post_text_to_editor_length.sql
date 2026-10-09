-- 게시글 본문 글자 수 상한을 에디터·서버와 같은 5,000자로 맞춘다.
--
-- 에디터는 본문을 글자 수로 막고(설치 때 템플릿 기본값 500자가 그대로였다), 서버는 JSON 크기(20만 자)만 봐서
-- API로 직접 보내면 에디터보다 훨씬 긴 글이 저장됐다. 앱 규칙 POST_TEXT_MAX_CHARS(5,000자)를 기준으로
-- 에디터·서버·DB가 같은 숫자를 쓴다.
--
-- content_text는 서버가 에디터(Lexical getTextContent)와 같은 규칙으로 뽑은 본문 글자라, 에디터가 센 글자 수와 같다.
-- 앱은 UTF-16으로, DB는 코드 포인트로 세서 이모지가 있으면 앱이 먼저 막는다. 앱이 허용한 글을 DB가 거절하지는 않는다.
-- 본문 JSON·HTML 크기 상한(30만 자)은 서식·구조 크기를 막는 안전선으로 그대로 둔다.

alter table public.posts
  drop constraint posts_content_text_size,
  add constraint posts_content_text_size check (char_length(content_text) <= 5000);

comment on constraint posts_content_text_size on public.posts is
  '본문 글자 5,000자 이하. 앱 규칙(domain/post/schema.ts POST_TEXT_MAX_CHARS)과 같은 값이며, 에디터와 같은 규칙으로 뽑은 글자를 센다.';
