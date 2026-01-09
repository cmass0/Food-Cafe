"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PostSearchField } from "@/domain/post/types";

const SEARCH_FIELD_OPTIONS: { value: PostSearchField; label: string }[] = [
  { value: "title", label: "제목" },
  { value: "writer", label: "작성자" },
  { value: "contents", label: "본문" },
  { value: "title_contents", label: "제목 + 본문" },
];

export default function PostSearchForm() {
  const router = useRouter();
  const [searchField, setSearchField] = useState<PostSearchField>("title");
  const [searchText, setSearchText] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex justify-center">
        <div className="flex w-full max-w-md overflow-hidden rounded-md border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-36 items-center justify-between border-r px-3 py-2 text-sm cursor-pointer"
              >
                <span>{SEARCH_FIELD_OPTIONS.find((opt) => opt.value === searchField)?.label}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-36 text-sm">
              {SEARCH_FIELD_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  className="cursor-pointer"
                  key={opt.value}
                  onClick={() => setSearchField(opt.value)}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-1 items-center gap-2 px-3">
            <input
              className="w-full border-0 text-sm outline-none"
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button type="submit" className="text-gray-500">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
