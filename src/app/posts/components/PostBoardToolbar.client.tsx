"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import PostCreateButton from "./PostCreateButton";

type PostBoardToolbarProps = {
  boardType: string;
};

export default function PostBoardToolbar({ boardType }: PostBoardToolbarProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ type: boardType });
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
        <input
          id="board-post-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="게시글 내 검색"
          className="h-10 w-full rounded-md border border-zinc-200 bg-white py-2 pl-4 pr-10 text-sm outline-none transition placeholder:text-zinc-400 focus:border-[#15933d] focus:ring-2 focus:ring-emerald-100"
        />
        <button
          type="submit"
          aria-label="게시글 검색"
          className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-zinc-500 transition hover:text-[#16883d]"
        >
          <Search className="h-4 w-4" />
        </button>
      </form>
      <PostCreateButton appearance="outline" />
    </div>
  );
}
