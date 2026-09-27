"use client";

import { Bookmark, ChevronRight, Clock3, Eye, Heart, Plus, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import SectionErrorState from "@/components/status/SectionErrorState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { type KeyedSingleFlight, useKeyedSingleFlight } from "@/components/hooks/useSingleFlight";
import { listCombos } from "@/domain/combo/api";
import { setComboBookmark } from "@/domain/combo/combo_bookmark/api";
import { setComboLike } from "@/domain/combo/combo_like/api";
import type { ComboListResult, ComboSearchField, ComboSort, Combos } from "@/domain/combo/types";
import { PaginationComponent } from "@/components/Pagination";

const DEFAULT_LIMIT = 9;

const SORT_OPTIONS: { value: ComboSort; label: string }[] = [
  { value: "recent", label: "최신" },
  { value: "like", label: "좋아요" },
  { value: "view", label: "조회" },
];

const SEARCH_FIELD_OPTIONS: { value: ComboSearchField; label: string }[] = [
  { value: "title", label: "제목" },
  { value: "tag", label: "태그" },
  { value: "tag_title", label: "태그 + 제목" },
  { value: "writer", label: "작성자" },
];

function parseSort(value: string): ComboSort {
  if (value === "like" || value === "view") return value;
  return "recent";
}

function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatAge(value: Date | string | null | undefined): string {
  if (!value) return "날짜 없음";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days < 1) return "오늘";
  if (days < 7) return `${days}일 전`;
  if (days < 31) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "U";
}

function itemTitle(item: NonNullable<Combos["items"]>[number]): string {
  return item.type === "recipe" ? item.title || "레시피" : item.productName || "상품";
}

function itemImage(item: NonNullable<Combos["items"]>[number]): string | null {
  return item.image ?? null;
}

type ComboStats = {
  liked: boolean;
  likeCount: number;
  bookmarked: boolean;
  bookmarkCount: number;
};

function ComboActionButtons({
  combo,
  stats,
  onStatsChange,
  flight,
  compact = false,
}: {
  combo: Combos;
  stats: ComboStats;
  onStatsChange: (comboId: string, next: Partial<ComboStats>) => void;
  flight: KeyedSingleFlight;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  // 같은 조합의 버튼이 목록 카드와 미리보기 패널에 동시에 보이므로, 잠금은 부모가 조합·관계별로 공유한다.
  // 카드 전체가 클릭 영역이라 disabled 대신 클릭을 받아 전파를 막고, 요청 중인 클릭은 무시한다.
  const likeKey = `${combo.id}:like`;
  const bookmarkKey = `${combo.id}:bookmark`;

  function requireAuth() {
    const current = new URL(window.location.href);
    openAuthModal({ next: `${current.pathname}${current.search}` });
  }

  async function handleLike(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      requireAuth();
      return;
    }

    await flight.run(likeKey, async () => {
      try {
        const next = await setComboLike(combo.id, !stats.liked);
        onStatsChange(combo.id, {
          liked: next.liked,
          likeCount: next.likeCount,
        });
      } catch (error) {
        console.error("조합 좋아요 처리에 실패했습니다.", error);
      }
    });
  }

  async function handleBookmark(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      requireAuth();
      return;
    }

    await flight.run(bookmarkKey, async () => {
      try {
        const next = await setComboBookmark(combo.id, !stats.bookmarked);
        onStatsChange(combo.id, {
          bookmarked: next.bookmarked,
          bookmarkCount: next.bookmarkCount,
        });
      } catch (error) {
        console.error("조합 저장 처리에 실패했습니다.", error);
      }
    });
  }

  const buttonSurfaceClass = compact
    ? "grid h-8 w-8 place-items-center rounded-full bg-white text-zinc-500 shadow-sm transition hover:text-[#438e4d]"
    : "grid h-9 w-9 place-items-center rounded-full bg-white/95 text-zinc-500 shadow-sm transition hover:bg-white";

  return (
    <div className="flex items-center">
      <button
        type="button"
        aria-label={`저장 ${formatCount(stats.bookmarkCount)}`}
        onClick={handleBookmark}
        aria-disabled={flight.isRunning(bookmarkKey)}
        className="grid h-11 w-11 aria-disabled:cursor-wait place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
      >
        <span className={buttonSurfaceClass}>
          <Bookmark
            className={`h-4 w-4 ${stats.bookmarked ? "fill-amber-400 text-amber-400" : ""}`}
          />
        </span>
      </button>
      <button
        type="button"
        aria-label={`좋아요 ${formatCount(stats.likeCount)}`}
        onClick={handleLike}
        aria-disabled={flight.isRunning(likeKey)}
        className="grid h-11 w-11 aria-disabled:cursor-wait place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
      >
        <span className={buttonSurfaceClass}>
          <Heart
            className={`h-4 w-4 ${stats.liked ? "fill-red-400 text-red-400" : "text-red-500"}`}
          />
        </span>
      </button>
    </div>
  );
}

function ComboGridCard({
  combo,
  isActive,
  stats,
  onSelect,
  onStatsChange,
  flight,
}: {
  combo: Combos;
  isActive: boolean;
  stats: ComboStats;
  onSelect: () => void;
  onStatsChange: (comboId: string, next: Partial<ComboStats>) => void;
  flight: KeyedSingleFlight;
}) {
  const writerName = combo.writerName ?? "무명 셰프";
  const timeLabel = combo.timeMinutes ? `${combo.timeMinutes}분` : "시간 미정";
  const difficultyLabel = combo.difficulty ?? "보통";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={`group overflow-hidden rounded-lg border bg-white text-left shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md ${
        isActive ? "border-[#438e4d] ring-1 ring-[#438e4d]" : "border-zinc-200"
      }`}
    >
      <div className="relative aspect-[4/2.25] overflow-hidden bg-emerald-50">
        {combo.image ? (
          <Image
            src={combo.image}
            alt={combo.title || "레시피 조합 이미지"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 280px"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-emerald-700">
            이미지 준비 중
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4">
          <h2 className="line-clamp-1 text-base font-bold text-white">{combo.title}</h2>
          <div className="mt-3 flex gap-2">
            <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              {difficultyLabel}
            </span>
            <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
              {timeLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-zinc-500">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
            {initials(writerName)}
          </span>
          <span className="truncate">{writerName}</span>
          <span className="shrink-0">·</span>
          <span className="shrink-0">{formatAge(combo.createdAt)}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-4 w-4 fill-red-400 text-red-400" />
              {formatCount(stats.likeCount)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bookmark className="h-4 w-4 fill-amber-400 text-amber-400" />
              {formatCount(stats.bookmarkCount)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-zinc-800" />
              {formatCount(combo.viewCount)}
            </span>
          </div>
          <ComboActionButtons
            combo={combo}
            stats={stats}
            onStatsChange={onStatsChange}
            flight={flight}
            compact
          />
        </div>
      </div>
    </article>
  );
}

function ComboPreviewPanel({
  combo,
  stats,
  onStatsChange,
  flight,
}: {
  combo: Combos | null;
  stats: ComboStats | null;
  onStatsChange: (comboId: string, next: Partial<ComboStats>) => void;
  flight: KeyedSingleFlight;
}) {
  if (!combo || !stats) {
    return (
      <aside className="hidden h-full items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-500 lg:flex">
        조합을 선택하면 상세 미리보기가 표시됩니다.
      </aside>
    );
  }

  const writerName = combo.writerName ?? "무명 셰프";
  const activeItems = combo.items ?? [];
  const tags = combo.tags?.length ? combo.tags.slice(0, 6) : ["조합"];

  return (
    <aside className="flex h-full flex-col rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="relative aspect-[4/2.6] overflow-hidden rounded-t-lg bg-emerald-50">
        {combo.image ? (
          <Image
            src={combo.image}
            alt={combo.title || "레시피 조합 미리보기 이미지"}
            fill
            sizes="(max-width: 1024px) 100vw, 380px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-emerald-700">
            이미지 준비 중
          </div>
        )}
        <span className="absolute left-5 top-5 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-800">
          {combo.difficulty ?? "보통"}
        </span>
        <div className="absolute right-5 top-5">
          <ComboActionButtons
            combo={combo}
            stats={stats}
            onStatsChange={onStatsChange}
            flight={flight}
            compact
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-5 py-5">
        <div>
          <h2 className="line-clamp-1 text-xl font-black text-zinc-950">{combo.title}</h2>
          <div className="mt-2 flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
              {initials(writerName)}
            </span>
            <span>{writerName}</span>
            <span>·</span>
            <span>{formatAge(combo.createdAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 rounded-lg border border-zinc-200 bg-white text-center text-xs text-zinc-500">
          <div className="p-3">
            <Heart className="mx-auto mb-1 h-4 w-4 fill-red-400 text-red-400" />
            <p className="font-bold text-zinc-900">{formatCount(stats.likeCount)}</p>
            <p className="mt-1">좋아요</p>
          </div>
          <div className="p-3">
            <Bookmark className="mx-auto mb-1 h-4 w-4 fill-amber-400 text-amber-400" />
            <p className="font-bold text-zinc-900">{formatCount(stats.bookmarkCount)}</p>
            <p className="mt-1">저장</p>
          </div>
          <div className="p-3">
            <Eye className="mx-auto mb-1 h-4 w-4 text-zinc-800" />
            <p className="font-bold text-zinc-900">{formatCount(combo.viewCount)}</p>
            <p className="mt-1">조회수</p>
          </div>
          <div className="p-3">
            <Clock3 className="mx-auto mb-1 h-4 w-4 text-zinc-800" />
            <p className="font-bold text-zinc-900">{combo.timeMinutes ?? "-"}</p>
            <p className="mt-1">총 시간</p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-950">태그</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link
                key={tag}
                href={`/combos?search=${encodeURIComponent(tag)}&searchField=tag_title`}
                className="rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>

        <div className="min-h-0">
          <h3 className="text-sm font-bold text-zinc-950">구성 레시피</h3>
          <div className="mt-3 h-[156px] space-y-2 overflow-y-auto overscroll-contain pr-1">
            {activeItems.length ? (
              activeItems.map((item, index) => {
                const title = itemTitle(item);
                const image = itemImage(item);
                return (
                  <div
                    key={`${item.type}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2"
                  >
                    <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-md bg-emerald-50">
                      {image ? (
                        <Image src={image} alt={title} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-emerald-700">
                          이미지 없음
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-bold text-zinc-900">{title}</p>
                      <p className="line-clamp-1 text-xs text-zinc-500">
                        {item.summary || (item.type === "recipe" ? "레시피" : "상품")}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-zinc-500" />
                  </div>
                );
              })
            ) : (
              <p className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                구성 항목이 없습니다.
              </p>
            )}
          </div>
        </div>

        <Button
          asChild
          className="mt-auto h-12 w-full rounded-lg bg-[#2e9a48] font-bold text-white hover:bg-[#247d3a]"
        >
          <Link href={`/combos/${combo.id}`}>상세보기</Link>
        </Button>
      </div>
    </aside>
  );
}

function CombosPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [pageMeta, setPageMeta] = useState<Pick<ComboListResult, "limit" | "offset" | "total">>({
    limit: requestedPageSize,
    offset: 0,
    total: 0,
  });
  const [searchText, setSearchText] = useState(searchQuery ?? "");
  const [searchField, setSearchField] = useState<ComboSearchField>(fieldParam);
  const [comboStats, setComboStats] = useState<Record<string, ComboStats>>({});
  const relationFlight = useKeyedSingleFlight();

  useEffect(() => {
    setSearchText(searchQuery ?? "");
    setSearchField(fieldParam);
  }, [searchQuery, fieldParam]);

  useEffect(() => {
    let mounted = true;

    async function fetchCombos() {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await listCombos({
          limit: requestedPageSize,
          page: currentPage,
          sort,
          ...(searchQuery ? { search: searchQuery, searchField: fieldParam } : {}),
        });
        const items = (data?.items ?? []).map((item: Combos) => ({
          ...item,
          createdAt: item?.createdAt ? new Date(item.createdAt) : new Date(0),
          updatedAt: item?.updatedAt ? new Date(item.updatedAt) : new Date(0),
        })) as Combos[];

        if (mounted) {
          setCombos(items);
          setComboStats((previous) => {
            const next = { ...previous };
            for (const combo of items) {
              next[combo.id] = {
                liked: (combo as { liked?: boolean }).liked ?? next[combo.id]?.liked ?? false,
                likeCount: combo.likeCount ?? next[combo.id]?.likeCount ?? 0,
                bookmarked:
                  (combo as { bookmarked?: boolean }).bookmarked ??
                  next[combo.id]?.bookmarked ??
                  false,
                bookmarkCount: combo.bookmarkCount ?? next[combo.id]?.bookmarkCount ?? 0,
              };
            }
            return next;
          });
          setPageMeta({
            limit: data.limit,
            offset: data.offset,
            total: data.total,
          });
        }
      } catch (error) {
        console.error("조합 목록을 불러오지 못했습니다.", error);
        if (mounted) {
          setLoadError(true);
          setCombos([]);
          setPageMeta({ limit: requestedPageSize, offset: 0, total: 0 });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchCombos();
    return () => {
      mounted = false;
    };
  }, [requestedPageSize, currentPage, searchQuery, fieldParam, user?.id, sort, reloadKey]);

  useEffect(() => {
    if (combos.length === 0) {
      setActiveComboId(null);
      return;
    }
    if (!activeComboId || !combos.some((combo) => combo.id === activeComboId)) {
      setActiveComboId(combos[0]?.id ?? null);
    }
  }, [combos, activeComboId]);

  const activeCombo = useMemo(() => {
    if (combos.length === 0) return null;
    return combos.find((combo) => combo.id === activeComboId) ?? combos[0] ?? null;
  }, [combos, activeComboId]);

  function updateComboStats(comboId: string, nextStats: Partial<ComboStats>) {
    setComboStats((previous) => ({
      ...previous,
      [comboId]: {
        liked: previous[comboId]?.liked ?? false,
        likeCount: previous[comboId]?.likeCount ?? 0,
        bookmarked: previous[comboId]?.bookmarked ?? false,
        bookmarkCount: previous[comboId]?.bookmarkCount ?? 0,
        ...nextStats,
      },
    }));
  }

  function getStats(combo: Combos): ComboStats {
    return (
      comboStats[combo.id] ?? {
        liked: (combo as { liked?: boolean }).liked ?? false,
        likeCount: combo.likeCount ?? 0,
        bookmarked: (combo as { bookmarked?: boolean }).bookmarked ?? false,
        bookmarkCount: combo.bookmarkCount ?? 0,
      }
    );
  }

  function handleCreate() {
    if (!user) {
      openAuthModal({ next: "/combos/new" });
      return;
    }
    router.push("/combos/new");
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchText.trim();
    const params = new URLSearchParams();
    if (trimmed) {
      params.set("search", trimmed);
      params.set("searchField", searchField);
    }
    router.push(params.size ? `/combos?${params.toString()}` : "/combos");
  }

  const pageSize = pageMeta.limit > 0 ? pageMeta.limit : requestedPageSize;
  const showPreview = !loading && !loadError && activeCombo !== null;
  const paginationQuery: Record<string, string> = {};
  if (searchQuery) {
    paginationQuery.search = searchQuery;
    paginationQuery.searchField = fieldParam;
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto w-full max-w-7xl px-5 py-10 md:py-12 lg:px-8">
        <section className="mb-8 space-y-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-950">레시피 조합</h1>
              <p className="mt-3 text-sm font-medium text-zinc-500">
                여러 레시피를 하나로 조합해보세요.
              </p>
            </div>
            <Button
              className="h-12 rounded-full bg-[#15803d] px-7 text-base font-bold text-white shadow-sm hover:bg-[#126b34]"
              onClick={handleCreate}
            >
              <Plus className="mr-2 h-5 w-5" />
              조합 만들기
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Tabs value={sort} onValueChange={(value) => setSort(parseSort(value))}>
              <TabsList className="h-12 w-full max-w-[260px] rounded-full bg-zinc-100 p-1.5 md:w-auto">
                {SORT_OPTIONS.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="h-9 rounded-full px-5 text-sm font-bold text-zinc-500 data-[state=active]:bg-[#34783f] data-[state=active]:text-white data-[state=active]:shadow-none"
                  >
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <form
              onSubmit={handleSearchSubmit}
              className="flex h-12 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition focus-within:border-[#438e4d] focus-within:ring-2 focus-within:ring-[#438e4d]/30 md:max-w-[470px]"
            >
              <Select
                value={searchField}
                onValueChange={(value) => setSearchField(value as ComboSearchField)}
              >
                <SelectTrigger
                  size="lg"
                  aria-label="검색 범위"
                  className="h-12 w-32 rounded-none border-0 border-r border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-800 shadow-none focus:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEARCH_FIELD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex min-w-0 flex-1 items-center gap-3 px-4">
                <Input
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="조합 검색..."
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm shadow-none outline-none placeholder:text-zinc-400 focus-visible:ring-0"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  aria-label="검색"
                  className="h-11 w-11 shrink-0 rounded-md text-zinc-500 hover:text-zinc-900"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </form>
          </div>
        </section>

        <div
          className={
            showPreview
              ? "grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-stretch"
              : "grid gap-8"
          }
        >
          <section className="flex flex-col gap-7">
            {loading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[245px] animate-pulse rounded-lg border border-zinc-200 bg-zinc-50"
                  />
                ))}
              </div>
            ) : loadError ? (
              <SectionErrorState
                title="조합 목록을 불러오지 못했습니다."
                onRetry={() => setReloadKey((current) => current + 1)}
              />
            ) : combos.length ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {combos.map((combo) => (
                  <ComboGridCard
                    key={combo.id}
                    combo={combo}
                    isActive={combo.id === activeCombo?.id}
                    stats={getStats(combo)}
                    onSelect={() => setActiveComboId(combo.id)}
                    onStatsChange={updateComboStats}
                    flight={relationFlight}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center">
                <p className="text-sm font-semibold text-zinc-700">조건에 맞는 조합이 없습니다.</p>
                <p className="mt-2 text-sm text-zinc-500">
                  검색어를 바꾸거나 새 조합을 만들어보세요.
                </p>
              </div>
            )}

            {!loading && !loadError && pageMeta.total > 0 ? (
              <div className="flex justify-center">
                <PaginationComponent
                  basePath="/combos"
                  page={currentPage}
                  pageItemSize={pageSize}
                  total={pageMeta.total}
                  query={paginationQuery}
                />
              </div>
            ) : null}
          </section>

          {showPreview ? (
            <ComboPreviewPanel
              combo={activeCombo}
              stats={getStats(activeCombo)}
              onStatsChange={updateComboStats}
              flight={relationFlight}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function CombosPage() {
  return (
    <Suspense fallback={<div className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8" />}>
      <CombosPageInner />
    </Suspense>
  );
}
