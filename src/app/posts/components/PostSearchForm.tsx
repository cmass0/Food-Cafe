"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { PostSearchField } from "@/domain/post/types";
import SearchForm from "@/lib/searchForm/searchform";

const SEARCH_FIELD_OPTIONS: { value: PostSearchField; label: string }[] = [
  { value: "title", label: "제목" },
  { value: "writer", label: "작성자" },
  { value: "contents", label: "본문" },
  { value: "title_contents", label: "제목 + 본문" },
];

export default function PostSearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search");
  const fieldParam = (searchParams.get("searchField") as PostSearchField) ?? "title";

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    searchText: string,
    searchField: PostSearchField
  ) => {
    event.preventDefault();
    const trimmed = searchText.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("search", trimmed);
      params.set("searchField", searchField);
    }
    router.push(params.size ? `/posts?${params.toString()}` : "/posts");
  };

  return (
    <div className="flex w-full justify-center">
      <SearchForm<PostSearchField>
        searchHandler={handleSubmit}
        searchoptions={SEARCH_FIELD_OPTIONS}
        searchQuery={searchQuery || ""}
        searchFieldQuery={fieldParam}
      />
    </div>
  );
}
