"use client";

import { ArrowLeft, FileSearch } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  /** 현재 주소에서 지울 페이지 쿼리 이름. 지우면 같은 조건의 첫 페이지가 된다. */
  pageParam?: string;
  compact?: boolean;
  className?: string;
};

/**
 * 요청한 페이지가 목록 범위를 벗어났을 때의 안내. 조회 장애가 아니므로 다시 시도 대신
 * 첫 페이지로 이동하게 한다. 범위 밖이면 전체 건수를 알 수 없어 페이지 번호는 보여 주지 않는다.
 */
export default function PageOutOfRange({ pageParam = "page", compact = false, className }: Props) {
  const pathname = usePathname();
  const params = new URLSearchParams(useSearchParams()?.toString());
  params.delete(pageParam);
  const query = params.toString();
  const firstPageHref = query ? `${pathname}?${query}` : pathname;

  return (
    <div
      className={cn(
        "flex rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-5",
        compact
          ? "flex-col items-stretch gap-3 py-3 text-left sm:flex-row sm:items-center sm:justify-between"
          : "min-h-[180px] flex-col items-center justify-center py-10 text-center",
        className
      )}
      role="status"
    >
      <div
        className={cn(
          "flex min-w-0",
          compact ? "items-start gap-3 sm:items-center" : "flex-col items-center"
        )}
      >
        <FileSearch
          className={cn("shrink-0 text-zinc-400", compact ? "size-5" : "mb-3 size-8")}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-zinc-700">
            이 페이지에는 표시할 항목이 없습니다.
          </p>
          <p className={cn("text-sm text-zinc-500", compact ? "mt-0.5" : "mt-2")}>
            목록이 줄었거나 주소의 페이지 번호가 잘못되었을 수 있습니다.
          </p>
        </div>
      </div>
      <Button
        asChild
        variant="outline"
        size="sm"
        className={cn("gap-2", compact ? "w-full sm:w-auto sm:shrink-0" : "mt-5")}
      >
        <Link href={firstPageHref} prefetch={false} scroll={false}>
          <ArrowLeft className="size-4" aria-hidden="true" />첫 페이지로
        </Link>
      </Button>
    </div>
  );
}
