"use client";

import { PaginationComponent } from "@/components/pagenation/pagenation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listCombos } from "@/domain/combo/api";
import type { ComboListResult, Combos } from "@/domain/combo/types";
import { Bookmark, Eye, Heart } from "lucide-react";
import Image from "next/image";
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
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
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

  const handleSortChange = (value: string) => {
    setSort(parseSort(value));
  };

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
            여러 레시피를 한 끼로 묶어 추천해요. 저장/좋아요로 나만의 조합을 모아보세요.
          </p>
        </div>
        <Button asChild className="rounded-full px-5">
          <Link href="/combos/new">조합 만들기</Link>
        </Button>
      </header>
      <Card>
        <Tabs value={sort} onValueChange={handleSortChange}>
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
            {/* 레시피 조합 grid 영역 시작  */}
            {sortedCombos.length === 0 ? (
              <Card className="col-span-full flex min-h-[240px] items-center justify-center border border-dashed border-muted-foreground/30 bg-muted/30 text-sm text-muted-foreground">
                아직 등록된 조합이 없어요.
              </Card>
            ) : (
              sortedCombos.map((combo) => {
                const createdLabel = combo.createdAt.toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                });
                const isActive = combo.id === activeCombo?.id;

                return (
                  <Card
                    key={combo.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveComboId(combo.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveComboId(combo.id);
                      }
                    }}
                    className={`group h-[170px] overflow-hidden rounded-2xl border border-muted-foreground/20 bg-background shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                      isActive ? "ring-2 ring-emerald-400/60" : ""
                    }`}
                  >
                    <div className="flex h-full">
                      <div className="relative h-full w-32 shrink-0 overflow-hidden bg-muted/30 sm:w-36">
                        {combo.image ? (
                          <Image
                            src={combo.image}
                            alt={combo.title || "조합 이미지"}
                            fill
                            sizes="(max-width: 1280px) 100vw, 160px"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            이미지 없음
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col  justify-between gap-2 p-3">
                        <div className="space-y-1">
                          <div className="flex flex-col flex-wrap items-start gap-2">
                            <h2 className="line-clamp-1 text-sm font-semibold">{combo.title}</h2>
                            <div className="flex  gap-1 overflow-hidden truncate">
                              {combo.difficulty ? (
                                <Badge className="border text-black border-emerald-400/30 bg-emerald-500/10 hover:text-white">
                                  {combo.difficulty}
                                </Badge>
                              ) : null}
                              {combo.timeMinutes ? (
                                <Badge className="border text-black border-emerald-400/30 bg-emerald-500/10 hover:text-white">
                                  {combo.timeMinutes}분
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                          <p className="line-clamp-2 text-xs text-muted-foreground ">
                            {combo.summary || "설명이 없습니다."}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Heart className="h-3 w-3 text-red-500 fill-pink-400" />
                            {combo.likeCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Eye className="h-3 w-3 text-black" /> {combo.viewCount ?? 0}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Bookmark className="h-3 w-3 text-black fill-emerald-400" />
                            {combo.bookmarkCount ?? 0}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            구성 {combo.items?.length ?? 0}개 · {createdLabel}
                          </span>
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="h-7 rounded-full"
                          >
                            <Link href={`/combos/${combo.id}`}>상세보기</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>

          <footer>
            <PaginationComponent
              basePath="/combos"
              page={currentPage}
              pageItemSize={pageSize}
              total={pageMeta.total}
            />
          </footer>
        </section>

        <section className="w-full lg:w-1/3">
          <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-muted-foreground/20 bg-background shadow-sm">
            <div className="border-b border-muted-foreground/20 p-4">
              <h2 className="text-lg font-semibold">
                {activeCombo?.title ?? "조합을 선택해 주세요"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {activeCombo
                  ? `${activeCombo.writerName ?? ""} · ${activeCombo.createdAt.toLocaleDateString(
                      "ko-KR",
                      { month: "short", day: "numeric" }
                    )}`
                  : "왼쪽 카드에서 조합을 선택하면 상세 정보가 보여요."}
              </p>
            </div>

            <div className="relative h-52 w-full overflow-hidden bg-muted/30">
              {activeCombo?.image ? (
                <Image
                  src={activeCombo.image}
                  alt={activeCombo.title || "조합 미리보기 이미지"}
                  fill
                  sizes="(max-width: 1280px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                  이미지 없음
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col gap-4 p-4">
              <p className="line-clamp-4 text-sm text-muted-foreground ">
                {activeCombo?.summary || "요약 정보가 없습니다."}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <span>난이도 {activeCombo?.difficulty ?? "미정"}</span>
                <span>
                  총시간 {activeCombo?.timeMinutes ? `${activeCombo.timeMinutes}분` : "미정"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-red-500 fill-pink-400" />
                  {activeCombo?.likeCount ?? 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <Eye className="h-3 w-3 text-black" /> {activeCombo?.viewCount ?? 0}
                </span>
                <span className="flex items-center gap-1.5">
                  <Bookmark className="h-3 w-3 text-black bfg fill-emerald-400" />
                  {activeCombo?.bookmarkCount ?? 0}
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">태그</p>
                <div className="flex flex-wrap gap-2">
                  {activeCombo?.tags?.length ? (
                    activeCombo.tags.slice(0, 6).map((tag) => (
                      <Badge
                        key={tag}
                        className="border text-black border-emerald-400/30 bg-emerald-500/10 hover:text-white"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">태그 없음</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">구성 아이템</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {activeCombo?.items?.length ? (
                    activeCombo.items.slice(0, 5).map((item, index) => {
                      const label =
                        item.type === "product"
                          ? item.productName || `상품 ${index + 1}`
                          : item.summary || `레시피 ${index + 1}`;
                      return (
                        <li key={`${item.type}-${index}`} className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/70" />
                          <span className="line-clamp-1">{label}</span>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-xs text-muted-foreground">구성 아이템이 없습니다.</li>
                  )}
                </ul>
              </div>

              {activeCombo ? (
                <Button asChild className="mt-auto w-full rounded-full">
                  <Link href={`/combos/${activeCombo.id}`}>상세보기</Link>
                </Button>
              ) : null}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
