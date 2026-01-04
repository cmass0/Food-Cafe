"use client";

import { PaginationComponent } from "@/components/pagenation/pagenation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
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
  const activeItems = activeCombo?.items ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-16 pt-10">
      {/* 헤더  */}
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
      {/* 정렬 탭 */}
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

      {/* 메인 시작 */}
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
                    {/* 이미지 */}
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
                      {/* 제목 / 난이도 / 소요시간 / 요약 */}
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
                          <div>
                            <p className="line-clamp-2 text-xs text-muted-foreground ">
                              {combo.summary || "설명이 없습니다."}
                            </p>
                          </div>
                        </div>

                        {/* 좋아요 / 조회수 / 북마크 */}
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

                        {/* 조합의 구성 아이템 수 / 상세보기 버튼 */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>구성 {combo.items?.length ?? 0}개</span>
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
          {/* 레시피 조합 grid 영역 끝 */}

          {/* 레시피 조합 페이징  */}
          <footer>
            <PaginationComponent
              basePath="/combos"
              page={currentPage}
              pageItemSize={pageSize}
              total={pageMeta.total}
            />
          </footer>
        </section>

        {/* 조합 미리보기 카드 영역 시작 */}
        <section className="w-full lg:w-1/3">
          <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-muted-foreground/20 bg-background shadow-sm">
            <div className="border-b border-muted-foreground/20 p-4">
              <h2 className="line-clamp-1 text-lg font-semibold">
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
            {/* 이미지 */}
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

            {/* 요약 */}
            <div className="flex flex-1 flex-col gap-4 p-4">
              <p className="line-clamp-4 text-sm text-muted-foreground ">
                {activeCombo?.summary || "요약 정보가 없습니다."}
              </p>

              {/* 난이도 / 시간 / 좋아요 / 조회수 / 북마크 */}
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
                  <Bookmark className="h-3 w-3 text-black fill-emerald-400" />
                  {activeCombo?.bookmarkCount ?? 0}
                </span>
              </div>

              {/* 태그  */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">태그</p>
                <div className="flex max-h-16 flex-wrap gap-2 overflow-y-auto">
                  {activeCombo?.tags?.length ? (
                    activeCombo.tags.slice(0, 6).map((tag) => (
                      <Badge
                        key={tag}
                        title={tag}
                        className="max-w-full truncate border text-black border-emerald-400/30 bg-emerald-500/10 hover:text-white"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">태그 없음</span>
                  )}
                </div>
              </div>

              {/* 구성아이템 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">구성 아이템</p>
                <div className="text-xs text-muted-foreground">
                  <Carousel
                    className="w-full"
                    opts={{ align: "start", containScroll: "trimSnaps" }}
                  >
                    <CarouselContent className="-ml-2">
                      {activeItems.length ? (
                        activeItems.map((item, index) => {
                          const title =
                            item.type === "recipe"
                              ? item.title || "레시피명 없음"
                              : item.productName || "제품명 없음";
                          const image = item.image ?? null;
                          return (
                            <CarouselItem
                              key={`${item.type}-${index}`}
                              className="pl-2 basis-[110px] sm:basis-[120px]"
                            >
                              <Card className="overflow-hidden border border-muted-foreground/20">
                                <div className="relative h-16 w-full">
                                  {image ? (
                                    <Image src={image} fill alt={title} className="object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground border-b-1">
                                      이미지 없음
                                    </div>
                                  )}
                                </div>
                                <div className="flex justify-center items-center px-2 py-1 text-[11px] text-muted-foreground line-clamp-1">
                                  {title}
                                </div>
                              </Card>
                            </CarouselItem>
                          );
                        })
                      ) : (
                        <div className="text-xs text-muted-foreground">구성 아이템이 없습니다.</div>
                      )}
                    </CarouselContent>
                    <CarouselPrevious className="left-2 h-7 w-7 disabled:pointer-events-none disabled:opacity-0" />
                    <CarouselNext className="right-2 h-7 w-7 disabled:pointer-events-none disabled:opacity-0" />
                  </Carousel>
                </div>
              </div>

              {activeCombo ? (
                <Button asChild className="mt-auto w-full rounded-full">
                  <Link href={`/combos/${activeCombo.id}`}>상세보기</Link>
                </Button>
              ) : null}
            </div>
          </Card>
        </section>
        {/* 조합 미리보기 카드 영역 끝 */}
      </main>
      {/* 메인 끝 */}
    </div>
  );
}
