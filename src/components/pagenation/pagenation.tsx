import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import React from "react";

type PaginationComponentProps = {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
  query?: Record<string, string | number | undefined>;
  pageParam?: string;
  limitParam?: string;
};

export function PaginationComponent({
  basePath,
  page, // 현재 페이지 번호
  pageSize,
  total,
  query,
  pageParam = "commentpage",
}: PaginationComponentProps) {
  if (pageSize <= 0) return null;
  const itemlange = pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  // 현재 페이지가 속한 10단위 블록 계산
  const start = Math.floor((currentPage - 1) / itemlange) * itemlange + 1;
  const end = Math.min(start + itemlange - 1, totalPages);

  // start~end까지 페이지 배열 생성
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const prevPage = Math.max(currentPage - 1, 1);
  const nextPage = Math.min(currentPage + 1, totalPages);
  const prevBlock = Math.max(start - itemlange, 1);
  const nextBlock = Math.min(start + itemlange, totalPages);

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

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {start == 1 ? null : (
            <PaginationLink href={buildHref(1)} aria-label="맨앞으로" prefetch={false}>
              ≪
            </PaginationLink>
          )}
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious href={buildHref(prevBlock)} aria-disabled={start === 1} />
        </PaginationItem>
        <PaginationItem>
          <PaginationPrevious href={buildHref(prevPage)} aria-disabled={currentPage === 1} />
        </PaginationItem>

        {pages.map((n) => (
          <PaginationItem key={n}>
            <PaginationLink href={buildHref(n)} isActive={n === currentPage} prefetch={false}>
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext href={buildHref(nextPage)} aria-disabled={currentPage === totalPages} />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext href={buildHref(nextBlock)} aria-disabled={end === totalPages} />
        </PaginationItem>
        <PaginationItem>
          {end === totalPages ? null : (
            <PaginationLink href={buildHref(totalPages)} aria-label="맨뒤로" prefetch={false}>
              ≫
            </PaginationLink>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
