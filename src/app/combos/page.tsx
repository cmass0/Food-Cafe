import { PaginationComponent } from "@/components/pagenation/pagenation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

const DEFAULT_LIMIT = 10;

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default function CombosPage({
  searchParams,
}: {
  searchParams?: { page?: SearchParamValue; limit?: SearchParamValue };
}) {
  const pageValue = firstValue(searchParams?.page);
  const limitValue = firstValue(searchParams?.limit);
  const pageNumber = Number(pageValue);
  const limitNumber = Number(limitValue);
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const pageSize = Number.isFinite(limitNumber) && limitNumber > 0 ? limitNumber : DEFAULT_LIMIT;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <header className=" ">
        <h1>레시피 조합</h1>
        <Link href="/combos/new">
          <Button>새 조합 만들기</Button>
        </Link>
        <p>여러 레시피를 조합해서 새로운 나만의 요리를 만들어보세요.</p>
        <Card className="mt-4  flex p-3 gap-2">
          <div>태그</div>
          <div>난이도</div>
          <div>시간</div>
          <div>칼로리</div>
          <div>정렬</div>
        </Card>
      </header>
      <main className="flex flex-col gap-6 lg:flex-row lg:justify-between">
        <section className="w-full pt-10 flex flex-col justify-between gap-5 lg:w-2/3">
          <Card className="grid grid-rows-3 grid-cols-3">
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
          </Card>
          <footer>
            <PaginationComponent
              basePath="/combos"
              page={currentPage}
              pageItemSize={pageSize}
              total={101}
            ></PaginationComponent>
          </footer>
        </section>
        <section className="w-full pt-10 lg:w-1/4">
          <Card className="grid grid-rows-3 grid-cols-3">
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
            <div>레시피 조합 리스트</div>
          </Card>
        </section>
      </main>
    </div>
  );
}
