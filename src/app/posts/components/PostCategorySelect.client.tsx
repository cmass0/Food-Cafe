"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PostSearchField } from "@/domain/post/types";

type Category = {
  value: string;
  label: string;
};

type PostCategorySelectProps = {
  categories: readonly Category[];
  activeCategory: string;
  search?: string;
  searchField?: PostSearchField;
};

export default function PostCategorySelect({
  categories,
  activeCategory,
  search,
  searchField,
}: PostCategorySelectProps) {
  const router = useRouter();
  const selectedValue = categories.some((category) => category.value === activeCategory)
    ? activeCategory
    : "all";

  function handleValueChange(category: string) {
    const params = new URLSearchParams();

    if (category !== "all") {
      params.set("category", category);
    }
    if (search) {
      params.set("search", search);
      params.set("searchField", searchField ?? "title");
    }

    const query = params.toString();
    router.push(query ? `/posts?${query}` : "/posts");
  }

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger
        size="lg"
        aria-label="게시글 카테고리"
        className="h-11 w-full rounded-xl border-zinc-200 bg-white px-4 font-bold text-zinc-700 shadow-sm hover:border-zinc-300 sm:w-52"
      >
        <SelectValue placeholder="카테고리 선택" />
      </SelectTrigger>
      <SelectContent>
        {categories.map((category) => (
          <SelectItem key={category.value} value={category.value}>
            {category.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
