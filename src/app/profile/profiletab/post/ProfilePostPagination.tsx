import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { ProfileSort, ProfileView } from "../../profile-types";
import type { ProfilePostType } from "./ProfilePostTab";

type Props = {
  type: ProfilePostType;
  page: number;
  limit: number;
  total: number;
  search?: string;
  sort?: ProfileSort;
  view?: ProfileView;
};

function buildHref(
  type: ProfilePostType,
  page: number,
  search?: string,
  sort: ProfileSort = "recent",
  view: ProfileView = "grid"
) {
  const params = new URLSearchParams({
    section: "post",
    tab: type,
    page: String(page),
    sort,
    view,
  });
  if (search) params.set("search", search);
  return `?${params.toString()}`;
}

function pageNumbers(current: number, totalPages: number) {
  const start = Math.max(1, Math.min(current - 1, totalPages - 2));
  const end = Math.min(totalPages, start + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export default function ProfilePostPagination({
  type,
  page,
  limit,
  total,
  search,
  sort = "recent",
  view = "grid",
}: Props) {
  if (total <= limit) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const numbers = pageNumbers(page, totalPages);

  return (
    <nav className="mt-8 flex justify-center" aria-label="게시글 페이지">
      <div className="flex h-14 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 shadow-sm">
        {page > 1 ? (
          <Link
            href={buildHref(type, page - 1, search, sort, view)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="이전 페이지"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center text-zinc-300">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        {numbers.map((number) => (
          <Link
            key={number}
            href={buildHref(type, number, search, sort, view)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
              number === page
                ? "bg-emerald-600 text-white"
                : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
            )}
            aria-current={number === page ? "page" : undefined}
          >
            {number}
          </Link>
        ))}
        {page < totalPages ? (
          <Link
            href={buildHref(type, page + 1, search, sort, view)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
            aria-label="다음 페이지"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center text-zinc-300">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  );
}
