"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { PostSearchField } from "@/domain/post/types";
import { normalizePostCategory } from "@/domain/post/category";
import { cn } from "@/lib/utils";
import SearchForm from "@/app/posts/ui/SearchForm";

const SEARCH_FIELD_OPTIONS: { value: PostSearchField; label: string }[] = [
  { value: "title", label: "제목" },
  { value: "writer", label: "작성자" },
  { value: "contents", label: "본문" },
  { value: "title_contents", label: "제목 + 본문" },
];

type PostSearchFormProps = {
  className?: string;
};

export default function PostSearchForm({ className }: PostSearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search");
  const fieldParam = (searchParams.get("searchField") as PostSearchField) ?? "title";
  const categoryParam =
    normalizePostCategory(searchParams.get("category")) ??
    normalizePostCategory(searchParams.get("type"));

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>,
    searchText: string,
    searchField: PostSearchField
  ) => {
    event.preventDefault();
    const trimmed = searchText.trim();
    const params = new URLSearchParams();

    if (categoryParam) {
      params.set("category", categoryParam);
    }
    if (trimmed) {
      params.set("search", trimmed);
      params.set("searchField", searchField);
    }

    router.push(params.size ? `/posts?${params.toString()}` : "/posts");
  };

  return (
    <div className={cn("flex w-full justify-center", className)}>
      <SearchForm<PostSearchField>
        searchHandler={handleSubmit}
        searchoptions={SEARCH_FIELD_OPTIONS}
        searchQuery={searchQuery || ""}
        searchFieldQuery={fieldParam}
        placeholder="검색어를 입력하세요"
        className="w-full sm:w-full"
        containerClassName="h-12 max-w-none rounded-lg border-zinc-200 bg-white shadow-sm"
        selectTriggerClassName="h-12 w-32 border-zinc-200 bg-white px-4 font-semibold text-zinc-900"
        inputClassName="h-full text-base"
        submitClassName="text-zinc-500 hover:text-zinc-900"
      />
    </div>
  );
}
