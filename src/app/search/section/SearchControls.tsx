"use client";

import { Grid3X3, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { isSearchSort, SEARCH_SORT_OPTIONS, type SearchSort } from "@/features/search/sort";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

type SearchControlsProps = {
  initialSort: SearchSort;
  initialView: ViewMode;
};

function isView(value: string | null): value is ViewMode {
  return value === "grid" || value === "list";
}

export default function SearchControls({ initialSort, initialView }: SearchControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sortParam = searchParams.get("sort");
  const viewParam = searchParams.get("view");
  const currentSort = isSearchSort(sortParam) ? sortParam : initialSort;
  const currentView = isView(viewParam) ? viewParam : initialView;

  function updateParam(key: "sort" | "view", value: SearchSort | ViewMode) {
    const params = new URLSearchParams(searchParams.toString());

    params.set(key, value);
    params.delete("recipePage");
    params.delete("comboPage");
    params.delete("postPage");

    const query = params.toString();
    router.push(query ? `/search?${query}` : "/search");
  }

  return (
    <div className="flex items-center gap-4">
      <label className="sr-only" htmlFor="search-sort">
        검색 결과 정렬
      </label>
      <select
        id="search-sort"
        value={currentSort}
        onChange={(event) => updateParam("sort", event.target.value as SearchSort)}
        className="h-11 rounded-lg border border-zinc-200 bg-white px-4 pr-10 text-sm font-bold text-zinc-900 shadow-sm outline-none transition focus:border-[#15933d] focus:ring-2 focus:ring-emerald-100"
      >
        {SEARCH_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="flex rounded-lg bg-zinc-100 p-1">
        <button
          type="button"
          aria-label="그리드 보기"
          aria-pressed={currentView === "grid"}
          onClick={() => updateParam("view", "grid")}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-md text-zinc-500 transition",
            currentView === "grid" ? "bg-white text-[#15933d] shadow-sm" : "hover:text-zinc-900"
          )}
        >
          <Grid3X3 className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="목록 보기"
          aria-pressed={currentView === "list"}
          onClick={() => updateParam("view", "list")}
          className={cn(
            "grid h-10 w-10 place-items-center rounded-md text-zinc-500 transition",
            currentView === "list" ? "bg-white text-[#15933d] shadow-sm" : "hover:text-zinc-900"
          )}
        >
          <List className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
