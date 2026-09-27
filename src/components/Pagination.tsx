import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationComponentProps = {
  basePath: string;
  page: number;
  pageItemSize: number;
  blockSize?: number;
  total: number;
  query?: Record<string, string | string[] | undefined>;
  pageParam?: string;
  limitParam?: string;
  scroll?: boolean;
};

export function PaginationComponent({
  basePath, // 기본 경로
  page, // 현재 페이지 번호
  pageItemSize, // 한 페이지당 아이템 수
  blockSize = 10, // 한 블록에 표시할 페이지 수
  total, // 전체 아이템 수
  query, // 추가 쿼리 파라미터
  pageParam = "page",
  scroll = true,
}: PaginationComponentProps) {
  if (blockSize <= 0 || pageItemSize <= 0) return null;
  const pageRange = blockSize;
  const totalPages = Math.max(1, Math.ceil(total / pageItemSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  // 화면 크기와 관계없이 호출부에서 지정한 페이지 묶음 단위를 유지합니다.
  const start = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  const end = Math.min(start + pageRange - 1, totalPages);

  // start~end까지 페이지 배열 생성
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  // 모바일에서는 현재 묶음 안에서 현재 페이지를 포함한 최대 5개만 표시합니다.
  const mobileStart = Math.max(start, Math.min(currentPage - 2, end - 4));
  const mobileEnd = Math.min(mobileStart + 4, end);
  const prevPage = Math.max(currentPage - 1, 1);
  const nextPage = Math.min(currentPage + 1, totalPages);
  const prevBlock = Math.max(start - pageRange, 1);
  const nextBlock = Math.min(start + pageRange, totalPages);

  const buildHref = (targetPage: number) => {
    const qs = new URLSearchParams();

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        qs.set(key, String(value));
      }
    }

    qs.set(pageParam, String(targetPage));
    const queryString = qs.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const linkClassName = "h-11 w-8 px-0 tabular-nums sm:h-10 sm:w-10";
  const renderDirection = (
    target: number,
    label: string,
    disabled: boolean,
    Icon: typeof ChevronLeft
  ) => (
    <PaginationItem>
      {disabled ? (
        <span
          role="link"
          aria-label={label}
          aria-disabled="true"
          className={cn("inline-flex items-center justify-center opacity-40", linkClassName)}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      ) : (
        <PaginationLink
          href={buildHref(target)}
          aria-label={label}
          className={linkClassName}
          prefetch={false}
          scroll={scroll}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </PaginationLink>
      )}
    </PaginationItem>
  );

  return (
    <Pagination aria-label="페이지 탐색">
      <PaginationContent className="gap-px sm:gap-1">
        {renderDirection(prevBlock, "이전 페이지 묶음", start === 1, ChevronsLeft)}
        {renderDirection(prevPage, "이전 페이지", currentPage === 1, ChevronLeft)}

        {pages.map((n) => (
          <PaginationItem
            key={n}
            className={cn(
              (n < mobileStart || n > mobileEnd) && "hidden sm:list-item",
              n === mobileStart && "ml-0.5 sm:ml-0",
              n === mobileEnd && "mr-0.5 sm:mr-0"
            )}
          >
            <PaginationLink
              href={buildHref(n)}
              isActive={n === currentPage}
              aria-label={`${n}페이지`}
              className={cn(
                linkClassName,
                n === currentPage && "bg-zinc-100 font-bold"
              )}
              prefetch={false}
              scroll={scroll}
            >
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}

        {renderDirection(nextPage, "다음 페이지", currentPage === totalPages, ChevronRight)}
        {renderDirection(nextBlock, "다음 페이지 묶음", end === totalPages, ChevronsRight)}
      </PaginationContent>
    </Pagination>
  );
}
