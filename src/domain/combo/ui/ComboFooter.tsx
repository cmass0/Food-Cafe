"use client";

import { PaginationComponent } from "@/components/pagenation/pagenation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [field, setField] = useState<ComboSearchField>(searchField ?? "title");
  const [searchText, setSearchText] = useState(searchQuery ?? "");

  const paginationQuery: Record<string, string> = {};
  if (searchQuery) {
    paginationQuery.search = searchQuery;
    paginationQuery.searchField = searchField ?? "title";
  }

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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

      <form onSubmit={handleSearchSubmit} className="w-full">
        <div className="flex justify-center">
          <div className="flex w-full max-w-md overflow-hidden rounded-md border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex w-32 items-center justify-between border-r px-3 py-2 text-sm"
                >
                  <span>{SEARCH_FIELD_OPTIONS.find((opt) => opt.value === field)?.label}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-32 text-sm">
                {SEARCH_FIELD_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    className="cursor-pointer"
                    key={opt.value}
                    onClick={() => setField(opt.value)}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex flex-1 items-center gap-2 px-3">
              <input
                className="w-full border-0 text-sm outline-none"
                onChange={(event) => setSearchText(event.target.value)}
                value={searchText}
              />
              <button type="submit" className="text-gray-500">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </footer>
  );
}
