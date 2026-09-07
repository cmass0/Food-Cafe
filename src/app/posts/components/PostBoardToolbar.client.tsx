"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PostCategory } from "@/domain/post/category";
import PostCreateButton from "./PostCreateButton";

type PostBoardToolbarProps = {
  category: PostCategory;
};

export default function PostBoardToolbar({ category }: PostBoardToolbarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ category });
    const term = search.trim();

    if (term) {
      params.set("search", term);
      params.set("searchField", "title");
    }

    router.push(`/posts?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <form onSubmit={handleSubmit} className="relative w-full sm:w-72">
        <label htmlFor="board-post-search" className="sr-only">
          게시글 검색
        </label>
        <Input
          id="board-post-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="게시글 내 검색"
          className="h-11 bg-white pl-4 pr-11"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          aria-label="게시글 검색"
          className="absolute inset-y-0 right-0 h-11 w-11 text-zinc-500 hover:text-[#16883d]"
        >
          <Search className="h-4 w-4" />
        </Button>
      </form>
      <PostCreateButton appearance="outline" />
    </div>
  );
}
