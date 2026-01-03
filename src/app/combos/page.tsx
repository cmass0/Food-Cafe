"use client";

import { PaginationComponent } from "@/components/pagenation/pagenation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listCombos } from "@/domain/combo/api";
import type { ComboListResult, Combos } from "@/domain/combo/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_LIMIT = 6;

type ComboSort = "recent" | "like" | "view";

function parseSort(value: string | null): ComboSort {
  if (value === "like" || value === "view" || value === "recent") return value;
  return "recent";
}

export default function CombosPage() {
  const searchParams = useSearchParams();
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const sortParam = searchParams.get("sort");
  const pageNumber = Number(pageParam);
  const limitNumber = Number(limitParam);
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const requestedPageSize =
    Number.isFinite(limitNumber) && limitNumber > 0 ? limitNumber : DEFAULT_LIMIT;
  const [sort, setSort] = useState<ComboSort>("recent");
  const [combos, setCombos] = useState<Combos[]>([]);
  const [pageMeta, setPageMeta] = useState<Pick<ComboListResult, "limit" | "offset" | "total">>({
    limit: requestedPageSize,
    offset: 0,
    total: 0,
  });

  useEffect(() => {
    setSort(parseSort(sortParam));
  }, [sortParam]);

  useEffect(() => {
    let mounted = true;

    async function fetchCombos() {
      try {
        const data = await listCombos({ limit: requestedPageSize, page: currentPage });
        const items = (data?.items ?? []).map((item: any) => ({
          ...item,
          createdAt: item?.createdAt ? new Date(item.createdAt) : new Date(0),
          updatedAt: item?.updatedAt ? new Date(item.updatedAt) : new Date(0),
        }));
        if (mounted) {
          setCombos(items);
          setPageMeta({
            limit: data.limit,
            offset: data.offset,
            total: data.total,
          });
        }
      } catch (error) {
        console.error("Failed to fetch combos.", error);
      }
    }

    fetchCombos();
    return () => {
      mounted = false;
    };
  }, [requestedPageSize, currentPage]);

  const sortedCombos = useMemo(() => {
    const base = [...combos];
    if (sort === "like") {
      return base.sort((a, b) => (b.likeCount ?? 0) - (a.likeCount ?? 0));
    }
    if (sort === "view") {
      return base.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    }
    return base.sort((a, b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
      return bTime - aTime;
    });
  }, [combos, sort]);

  const pageSize = pageMeta.limit > 0 ? pageMeta.limit : requestedPageSize;

  return (
    <div className="flex flex-col m-auto w-full max-w-7xl px-4 my-10 h-[80vh] border-2">
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
      <main className="flex gap-6 flex-row justify-between border-2 flex-1 items-stretch">
        {/* 레시피 grid */}
        <section className="w-full pt-10 flex flex-col justify-between gap-5 lg:w-2/3">
          <div className="grid grid-rows-3 grid-cols-2 border-2 flex-1">d</div>
          <footer className="border-2">
            <PaginationComponent
              basePath="/combos"
              page={currentPage}
              pageItemSize={pageSize}
              total={pageMeta.total}
            ></PaginationComponent>
          </footer>
        </section>
        {/* 레시피 미리보기  */}
        <section className=" pt-10 w-1/4 self-stretch flex min-h-0 border-2 ">
          <Card className="grid grid-rows-3 grid-cols-3  h-full w-full">dd</Card>
        </section>
      </main>
    </div>
  );
}
