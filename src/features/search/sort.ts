import type { ComboSort } from "@/domain/combo/types";
import type { PostListOptions } from "@/domain/post/types";
import type { RecipeSort } from "@/domain/recipe/types";

export const SEARCH_SORT_OPTIONS = [
  { value: "recent", label: "최신순" },
  { value: "like", label: "좋아요순" },
  { value: "view", label: "조회순" },
] as const;

export type SearchSort = (typeof SEARCH_SORT_OPTIONS)[number]["value"];

type ContentSorts = {
  recipe: RecipeSort;
  combo: ComboSort;
  post: NonNullable<PostListOptions["sort"]>;
};

export function isSearchSort(value: string | null | undefined): value is SearchSort {
  return SEARCH_SORT_OPTIONS.some((option) => option.value === value);
}

export function parseSearchSort(value: string | null | undefined): SearchSort {
  return isSearchSort(value) ? value : "recent";
}

/** 통합검색의 공통 정렬 키를 각 콘텐츠 도메인이 사용하는 키로 변환한다. */
export function toContentSorts(sort: SearchSort): ContentSorts {
  if (sort === "like") {
    return { recipe: "like", combo: "like", post: "likes" };
  }
  if (sort === "view") {
    return { recipe: "view", combo: "view", post: "views" };
  }
  return { recipe: "recent", combo: "recent", post: "recent" };
}
