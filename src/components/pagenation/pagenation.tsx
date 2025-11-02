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
};

export function PaginationComponent({
  basePath,
  page,
  pageSize,
  total,
  query,
}: PaginationComponentProps) {
  if (pageSize <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(page, 1), totalPages);

  const buildHref = (targetPage: number) => {
    const qs = new URLSearchParams();
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue;
        qs.set(key, String(value));
      }
    }
    qs.set("page", String(targetPage));
    qs.set("limit", String(pageSize));
    const queryString = qs.toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const pages = new Set<number>([1, totalPages]);
  for (let i = currentPage - 1; i <= currentPage + 1; i += 1) {
    if (i > 1 && i < totalPages) {
      pages.add(i);
    }
  }

  const sortedPages = Array.from(pages).sort((a, b) => a - b);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={buildHref(Math.max(currentPage - 1, 1))}
            aria-disabled={currentPage <= 1}
          />
        </PaginationItem>
        {sortedPages.map((pageNumber, index) => {
          const prev = sortedPages[index - 1];
          const needsEllipsis = index > 0 && prev !== undefined && pageNumber - prev > 1;

          return (
            <React.Fragment key={pageNumber}>
              {needsEllipsis ? (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : null}
              <PaginationItem>
                <PaginationLink
                  href={buildHref(pageNumber)}
                  isActive={pageNumber === currentPage}
                  prefetch={false}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            </React.Fragment>
          );
        })}
        <PaginationItem>
          <PaginationNext
            href={buildHref(Math.min(currentPage + 1, totalPages))}
            aria-disabled={currentPage >= totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
