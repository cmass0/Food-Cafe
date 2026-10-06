"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RecipeCategoryKey } from "@/domain/recipe/category";
import { toRecipeListQuery, type RecipeListQuery } from "@/domain/recipe/list-params";
import type { RecipeSearchField, RecipeSort } from "@/domain/recipe/types";

const SORT_OPTIONS: { key: RecipeSort; title: string }[] = [
  { key: "recent", title: "최신" },
  { key: "like", title: "좋아요" },
  { key: "view", title: "조회" },
];

const SEARCH_FIELD_OPTIONS: { value: RecipeSearchField; label: string }[] = [
  { value: "title", label: "제목" },
  { value: "tag", label: "태그" },
  { value: "tag_title", label: "태그 + 제목" },
  { value: "writer", label: "작성자" },
];

type RecipesToolbarProps = {
  sort: RecipeSort;
  category?: RecipeCategoryKey;
  searchQuery?: string;
  searchField: RecipeSearchField;
  limit: number;
  // 목록을 불러오지 못하면 개수를 보여주지 않는다.
  total?: number;
};

// 목록 조건은 모두 주소에 담는다. 주소가 바뀌면 서버가 그 조건으로 목록을 다시 그린다.
// 정렬·검색 조건을 바꾸면 결과 범위가 달라지므로 page는 1로 돌아간다.
function buildRecipesHref(query: RecipeListQuery): string {
  const params = new URLSearchParams(toRecipeListQuery(query));
  return params.size ? `/recipes?${params.toString()}` : "/recipes";
}

export default function RecipesToolbar({
  sort,
  category,
  searchQuery,
  searchField: currentSearchField,
  limit,
  total,
}: RecipesToolbarProps) {
  const router = useRouter();
  const [searchText, setSearchText] = useState(searchQuery ?? "");
  const [searchField, setSearchField] = useState<RecipeSearchField>(currentSearchField);

  useEffect(() => {
    setSearchText(searchQuery ?? "");
    setSearchField(currentSearchField);
  }, [searchQuery, currentSearchField]);

  function handleSortChange(value: string) {
    router.push(
      buildRecipesHref({
        sort: value as RecipeSort,
        category,
        search: searchQuery,
        searchField: currentSearchField,
        limit,
      })
    );
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildRecipesHref({ sort, category, search: searchText, searchField, limit }));
  }

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center justify-between gap-4 md:justify-start">
        {total !== undefined ? (
          <p className="text-sm text-zinc-500">
            총 <strong className="font-bold text-zinc-900">{total.toLocaleString("ko-KR")}</strong>
            개
          </p>
        ) : null}
        <Tabs value={sort} onValueChange={handleSortChange}>
          <TabsList className="h-10 rounded-full bg-zinc-100 p-1">
            {SORT_OPTIONS.map(({ key, title }) => (
              <TabsTrigger
                key={key}
                value={key}
                className="h-8 rounded-full px-4 text-sm font-semibold text-zinc-500 hover:text-zinc-800 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
              >
                {title}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <form
        onSubmit={handleSearchSubmit}
        className="flex h-11 w-full items-center overflow-hidden rounded-full border border-zinc-200 bg-white transition focus-within:border-[#438e4d] focus-within:ring-4 focus-within:ring-[#438e4d]/10 md:max-w-[440px]"
      >
        <Select
          value={searchField}
          onValueChange={(value) => setSearchField(value as RecipeSearchField)}
        >
          <SelectTrigger
            aria-label="검색 범위"
            className="h-full w-[7.5rem] shrink-0 rounded-none border-0 bg-transparent pl-5 pr-3 text-sm font-semibold text-zinc-700 shadow-none focus:ring-0"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SEARCH_FIELD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="h-5 w-px shrink-0 bg-zinc-200" aria-hidden="true" />
        <Input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="레시피 검색..."
          className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 text-sm shadow-none outline-none placeholder:text-zinc-400 focus-visible:ring-0"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="검색"
          className="mr-1 h-9 w-9 shrink-0 rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          <Search className="h-[18px] w-[18px]" />
        </Button>
      </form>
    </div>
  );
}
