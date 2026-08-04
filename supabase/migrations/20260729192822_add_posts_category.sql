alter table public.posts
  add column if not exists category text;

update public.posts
set category = case lower(trim(coalesce(type, '')))
  when 'board' then 'free'
  when 'free' then 'free'
  when '자유' then 'free'
  when 'info' then 'recipe_tip'
  when 'recipe_tip' then 'recipe_tip'
  when '정보' then 'recipe_tip'
  when '정보공유' then 'recipe_tip'
  when '레시피 팁' then 'recipe_tip'
  when 'question' then 'question'
  when 'qna' then 'question'
  when '질문' then 'question'
  when '질문&답변' then 'question'
  when 'review' then 'review'
  when '후기' then 'review'
  when '후기게시판' then 'review'
  else 'free'
end
where category is null
   or category not in ('free', 'recipe_tip', 'question', 'review');

alter table public.posts
  alter column category set default 'free',
  alter column category set not null;

alter table public.posts
  add constraint posts_category_allowed
  check (category in ('free', 'recipe_tip', 'question', 'review'));

create index if not exists posts_category_created_at_id_idx
  on public.posts (category, created_at desc, id asc);

comment on column public.posts.category is
  'Community category: free, recipe_tip, question, or review.';
