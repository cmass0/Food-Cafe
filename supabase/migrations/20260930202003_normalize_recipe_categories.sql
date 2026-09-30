-- 레시피 카테고리를 배달 앱 방식의 새 목록(#32)으로 맞춘다.
-- 옛 이름은 대응하는 새 이름으로, 목록에 없는 값은 "기타"로 바꾼다. 빈 값(카테고리 선택 안 함)과 NULL은 그대로 둔다.
-- 서버 입력 검사가 새 목록만 받으므로, 옛 값이 남으면 그 레시피는 홈 카테고리 필터에서 빠지고
-- 제목만 고쳐도 카테고리 검사에 걸려 저장이 막힌다.
-- 이미 새 목록 값인 행은 건드리지 않아 여러 번 실행해도 결과가 같다.
-- 추천 문서의 카테고리는 이 UPDATE로 갱신되지 않는다. 바뀐 행이 있으면 tools/recommend/backfill.ts를 다시 돌린다.
-- 작성자가 고친 것이 아니라 값만 정리하는 보정이므로 수정 시각(updated_at)은 그대로 둔다.
-- trg_recipes_set_updated_at은 category 변경에도 updated_at을 덮어쓰므로 이 UPDATE 동안만 끈다.
alter table public.recipes disable trigger trg_recipes_set_updated_at;

with mapped as (
  select
    id,
    case btrim(category)
      when '디저트' then '디저트·베이킹'
      when '샐러드' then '샐러드·건강식'
      when 'salad' then '샐러드·건강식'
      when '다이어트' then '샐러드·건강식'
      when '간식' then '간식·야식'
      when 'pasta' then '양식'
      else case
        when btrim(category) in (
          '한식', '고기·구이', '분식', '중식', '일식', '양식',
          '아시안', '샐러드·건강식', '디저트·베이킹', '간식·야식', '기타'
        ) then btrim(category)
        else '기타'
      end
    end as next_category
  from public.recipes
  where category is not null
    and btrim(category) <> ''
)
update public.recipes as recipe
set category = mapped.next_category
from mapped
where recipe.id = mapped.id
  and recipe.category is distinct from mapped.next_category;

alter table public.recipes enable trigger trg_recipes_set_updated_at;
