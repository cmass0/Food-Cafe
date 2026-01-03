import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type PaginationComponentProps = {
  basePath: string;
  page: number;
  pageItemSize: number;
  blockSize?: number;
  total: number;
  query?: Record<string, string | number | undefined>;
  pageParam?: string;
  limitParam?: string;
};

export function PaginationComponent({
  basePath, // 기본 경로
  page, // 현재 페이지 번호
  pageItemSize, // 한 페이지당 아이템 수
  blockSize = 10, // 한 블록에 표시할 페이지 수
  total, // 전체 아이템 수
  query, // 추가 쿼리 파라미터
  pageParam = "page",
}: PaginationComponentProps) {
  if (blockSize <= 0 || pageItemSize <= 0) return null;
  const pageRange = blockSize;
  const totalPages = Math.max(1, Math.ceil(total / pageItemSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);

  // 현재 페이지가 속한 10단위 블록 계산
  const start = Math.floor((currentPage - 1) / pageRange) * pageRange + 1;
  const end = Math.min(start + pageRange - 1, totalPages);

  // start~end까지 페이지 배열 생성
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
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

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          {start == 1 ? null : (
            <PaginationLink href={buildHref(1)} aria-label="맨앞" prefetch={false}>
              {/* ≪ */}
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
            <PaginationLink href={buildHref(totalPages)} aria-label="맨뒤" prefetch={false}>
              {/* ≫ */}
            </PaginationLink>
          )}
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
