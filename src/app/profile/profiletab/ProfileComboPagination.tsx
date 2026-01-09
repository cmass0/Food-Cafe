import Link from "next/link";
import type { ProfileComboType } from "./ProfileComboTab";

type PaginationProps = {
  type: ProfileComboType;
  page: number;
  limit: number;
  total: number;
  search?: string;
};

function buildPageHref(type: ProfileComboType, page: number, search?: string) {
  const params = new URLSearchParams();
  params.set("tab", type);
  params.set("page", String(page));
  if (search) {
    params.set("search", search);
  }
  return `?${params.toString()}`;
}

export default function ProfileComboPagination({ type, page, limit, total, search }: PaginationProps) {
  if (total <= limit) return null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
      {hasPrev ? (
        <Link
          className="rounded-md px-2 py-1 hover:bg-slate-100"
          href={buildPageHref(type, page - 1, search)}
        >
          이전
        </Link>
      ) : (
        <span className="rounded-md px-2 py-1 text-slate-300">이전</span>
      )}
      <span className="text-xs text-slate-400">
        {page} / {totalPages}
      </span>
      {hasNext ? (
        <Link
          className="rounded-md px-2 py-1 hover:bg-slate-100"
          href={buildPageHref(type, page + 1, search)}
        >
          다음
        </Link>
      ) : (
        <span className="rounded-md px-2 py-1 text-slate-300">다음</span>
      )}
    </div>
  );
}
