-- AI 추천 채팅이 레시피·콤보를 추천 카드로 보여준 횟수를 한국 날짜별로 누적한다.
-- 좋아요·북마크처럼 리소스별 테이블로 나눠 원본 삭제 시 FK CASCADE로 함께 정리한다.
-- 현재 화면은 전체 누적만 사용하고, 날짜는 이후 기간별 집계로 확장하기 위해 저장한다.
create table private.recipe_recommendation_counts (
  recipe_id uuid not null,
  day date not null,
  recommendation_count integer not null default 1,
  last_recommended_at timestamp with time zone not null default now(),

  constraint recipe_recommendation_counts_pkey
    primary key (recipe_id, day),
  constraint recipe_recommendation_counts_recipe_id_fkey
    foreign key (recipe_id) references public.recipes(id) on delete cascade,
  constraint recipe_recommendation_counts_count_check
    check (recommendation_count > 0)
);

create table private.combo_recommendation_counts (
  combo_id uuid not null,
  day date not null,
  recommendation_count integer not null default 1,
  last_recommended_at timestamp with time zone not null default now(),

  constraint combo_recommendation_counts_pkey
    primary key (combo_id, day),
  constraint combo_recommendation_counts_combo_id_fkey
    foreign key (combo_id) references public.combos(id) on delete cascade,
  constraint combo_recommendation_counts_count_check
    check (recommendation_count > 0)
);

comment on table private.recipe_recommendation_counts is
  'AI 추천 카드로 노출된 레시피의 한국 날짜별 추천 횟수. 검색 순위에는 사용하지 않는다.';
comment on table private.combo_recommendation_counts is
  'AI 추천 카드로 노출된 콤보의 한국 날짜별 추천 횟수. 검색 순위에는 사용하지 않는다.';
comment on column private.recipe_recommendation_counts.day is
  'Asia/Seoul 기준 날짜. DB 기본 시간대(UTC)의 current_date를 사용하지 않는다.';
comment on column private.combo_recommendation_counts.day is
  'Asia/Seoul 기준 날짜. DB 기본 시간대(UTC)의 current_date를 사용하지 않는다.';

alter table private.recipe_recommendation_counts enable row level security;
alter table private.combo_recommendation_counts enable row level security;

-- 브라우저와 일반 로그인 사용자는 카운트를 직접 읽거나 조작하지 못한다.
-- 증가와 조회는 이후 추가할 전용 RPC로만 수행한다.
revoke all on table private.recipe_recommendation_counts
  from public, anon, authenticated, service_role;
revoke all on table private.combo_recommendation_counts
  from public, anon, authenticated, service_role;

grant select on table private.recipe_recommendation_counts to service_role;
grant select on table private.combo_recommendation_counts to service_role;
