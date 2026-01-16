"use client";

import { PaginationComponent } from "@/lib/pagenation/pagenation";
import SearchForm from "@/lib/searchForm/searchform";
import { useRouter } from "next/navigation";
import type { ComboSearchField } from "../types";

const SEARCH_FIELD_OPTIONS: { value: ComboSearchField; label: string }[] = [
  { value: "title", label: "제목" },
  { value: "tag", label: "태그" },
  { value: "tag_title", label: "태그 + 제목" },
  { value: "writer", label: "작성자" },
];

type ComboFooterProps = {
  page: number;
  pageItemSize: number;
  total: number;
  basePath?: string;
  searchQuery?: string | null;
  searchField?: ComboSearchField | null;
};

export default function ComboFooter({
  page,
  pageItemSize,
  total,
  basePath = "/combos",
  searchQuery,
  searchField,
}: ComboFooterProps) {
  const router = useRouter();

  const paginationQuery: Record<string, string> = {};
  if (searchQuery) {
    paginationQuery.search = searchQuery;
    paginationQuery.searchField = searchField ?? "title";
  }

  const handleSearchSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    searchText: string,
    field: ComboSearchField
  ) => {
    event.preventDefault();
    const trimmed = searchText.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("search", trimmed);
      params.set("searchField", field);
    }
    router.push(params.size ? `${basePath}?${params.toString()}` : basePath);
  };

  return (
    <footer className="flex flex-col gap-4">
      <PaginationComponent
        basePath={basePath}
        page={page}
        pageItemSize={pageItemSize}
        total={total}
        query={paginationQuery}
      />

      <div className="flex justify-center">
        <SearchForm<ComboSearchField>
          searchHandler={handleSearchSubmit}
          searchoptions={SEARCH_FIELD_OPTIONS}
          searchQuery={searchQuery ?? ""}
          searchFieldQuery={searchField ?? "title"}
        />
      </div>
    </footer>
  );
}
