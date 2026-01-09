"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/app/auth/auth-context";
import { listCombos } from "@/domain/combo/api";
import type { ComboListResult, ComboSearchField, Combos } from "@/domain/combo/types";
import ComboCard from "@/domain/combo/ui/ComboCard";
import ComboFooter from "@/domain/combo/ui/ComboFooter";
import ComboPreviewCard from "@/domain/combo/ui/ComboPreviewCard";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const DEFAULT_LIMIT = 6;

type ComboSort = "recent" | "like" | "view";

const SORT_OPTIONS: { value: ComboSort; label: string }[] = [
  { value: "recent", label: "최신" },
  { value: "like", label: "좋아요" },
  { value: "view", label: "조회" },
];

function parseSort(value: string): ComboSort {
  if (value === "like" || value === "view") return value;
  return "recent";
}

export default function CombosPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const searchQuery = searchParams.get("search");
  const fieldParam = (searchParams.get("searchField") as ComboSearchField) ?? "title";

  const pageNumber = Number(pageParam);
  const limitNumber = Number(limitParam);
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const requestedPageSize =
    Number.isFinite(limitNumber) && limitNumber > 0 ? limitNumber : DEFAULT_LIMIT;
  const [sort, setSort] = useState<ComboSort>("recent");
  const [activeComboId, setActiveComboId] = useState<string | null>(null);
  const [combos, setCombos] = useState<Combos[]>([]);
  const [pageMeta, setPageMeta] = useState<Pick<ComboListResult, "limit" | "offset" | "total">>({
    limit: requestedPageSize,
    offset: 0,
    total: 0,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchCombos() {
      try {
        const data = await listCombos({
          limit: requestedPageSize,
          page: currentPage,
          ...(searchQuery ? { search: searchQuery, searchField: fieldParam } : {}),
        });
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
  }, [requestedPageSize, currentPage, searchQuery, fieldParam, user?.id]);

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

  useEffect(() => {
    if (sortedCombos.length === 0) {
      setActiveComboId(null);
      return;
    }
    if (!activeComboId || !sortedCombos.some((combo) => combo.id === activeComboId)) {
      if (sortedCombos[0]) {
        setActiveComboId(sortedCombos[0].id);
      }
    }
  }, [sortedCombos, activeComboId]);

  const activeCombo = useMemo(() => {
    if (sortedCombos.length === 0) return null;
    return sortedCombos.find((combo) => combo.id === activeComboId) ?? sortedCombos[0];
  }, [sortedCombos, activeComboId]);

  const pageSize = pageMeta.limit > 0 ? pageMeta.limit : requestedPageSize;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">레시피 조합</h1>
          <p className="text-sm text-muted-foreground">
            여러 레시피를 하나로 조합해보세요.
          </p>
        </div>
        <Button asChild className="rounded-full px-5">
          <Link href="/combos/new">조합 만들기</Link>
        </Button>
      </header>

      <Card>
        <Tabs value={sort} onValueChange={(value) => setSort(parseSort(value))}>
          <TabsList className="bg-background/60">
            {SORT_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value} className="text-xs">
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Card>

      <main className="flex flex-col gap-6 lg:flex-row">
        <section className="flex w-full flex-col gap-6 lg:w-2/3">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-2">
            {sortedCombos.length === 0 ? (
              <Card className="col-span-full flex min-h-[240px] items-center justify-center border border-dashed border-muted-foreground/30 bg-muted/30 text-sm text-muted-foreground">
                아직 등록된 조합이 없어요.
              </Card>
            ) : (
              sortedCombos.map((combo) => (
                <ComboCard
                  key={combo.id}
                  combo={combo}
                  isActive={combo.id === activeCombo?.id}
                  onSelect={() => setActiveComboId(combo.id)}
                />
              ))
            )}
          </div>

          <ComboFooter
            page={currentPage}
            pageItemSize={pageSize}
            total={pageMeta.total}
            searchQuery={searchQuery}
            searchField={fieldParam}
          />
        </section>

        <ComboPreviewCard combo={activeCombo ?? null} />
      </main>
    </div>
  );
}
