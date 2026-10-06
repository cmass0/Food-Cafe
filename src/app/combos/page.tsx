"use client";

import { Bookmark, ChevronRight, Clock3, Eye, Heart, Plus, Search, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import FoodImagePlaceholder from "@/components/FoodImagePlaceholder";
import Section from "@/components/status/Section";
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
import ReactionCount from "@/components/reactions/ReactionCount";
import { listCombos } from "@/domain/combo/api";
import type { ComboListResult, ComboSearchField, ComboSort, Combos } from "@/domain/combo/types";
import type { ApiError } from "@/lib/errors/api-client";
import { capImageDensity } from "@/lib/image-sizes";
import { cn } from "@/lib/utils";
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

type ComboItem = NonNullable<Combos["items"]>[number];

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

function itemTitle(item: ComboItem): string {
  return item.type === "recipe" ? item.title || "레시피" : item.productName || "상품";
}

function itemImage(item: ComboItem): string | null {
  return item.image ?? null;
}

// 조합에 무엇이 들어 있는지 구성 항목 사진을 겹쳐 보여준다. 넘치는 개수는 +N으로 줄인다.
function ItemThumbStack({ items }: { items: ComboItem[] }) {
  const shown = items.slice(0, 3);
  const rest = items.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((item, index) => {
        const image = itemImage(item);
        return (
          <span
            key={`${item.type}-${index}`}
            className="relative -ml-2 h-6 w-6 overflow-hidden rounded-full bg-[#f7f4ef] ring-2 ring-white first:ml-0 sm:h-8 sm:w-8"
          >
            {image ? (
              <Image src={image} alt="" fill sizes="32px" className="object-cover" />
            ) : (
              <FoodImagePlaceholder size="sm" />
            )}
          </span>
        );
      })}
      {rest > 0 ? (
        <span className="-ml-2 grid h-6 w-6 place-items-center rounded-full bg-zinc-900/70 text-[10px] font-bold text-white ring-2 ring-white backdrop-blur sm:h-8 sm:w-8 sm:text-[11px]">
          +{rest}
        </span>
      ) : null}
    </div>
  );
}

type PreviewHandlers = Pick<
  React.ComponentProps<typeof Link>,
  "onMouseEnter" | "onMouseLeave" | "onFocus"
>;

// 카드를 누르면 상세 화면으로 가고, 올려 두거나 키보드로 고르면 옆 미리보기가 바뀐다.
// 목록 카드와 미리보기는 보여주기만 한다. 좋아요·저장은 상세 화면에서 누른다.
function ComboGridCard({
  combo,
  isActive,
  previewHandlers,
}: {
  combo: Combos;
  isActive: boolean;
  previewHandlers: PreviewHandlers;
}) {
  const writerName = combo.writerName ?? "무명 셰프";
  const items = combo.items ?? [];
  const itemNames = items.map(itemTitle).join(" + ");

  return (
    <article className="group @container">
      <Link
        href={`/combos/${combo.id}`}
        prefetch={false}
        {...previewHandlers}
        className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#34783f] focus-visible:ring-offset-4"
      >
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f3efe8] ring-1 ring-black/5 transition duration-300 group-hover:shadow-lg group-hover:shadow-zinc-900/10 sm:rounded-2xl",
            // 미리보기는 넓은 화면에서만 카드 옆에 보이므로 선택 표시도 그때만 둔다.
            isActive && "lg:ring-2 lg:ring-[#34783f] lg:ring-offset-2"
          )}
        >
          {combo.image ? (
            <Image
              src={combo.image}
              alt={combo.title || "레시피 조합 이미지"}
              fill
              sizes={capImageDensity("(max-width: 1024px) 50vw, 300px")}
              className="object-cover transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <FoodImagePlaceholder />
          )}
          {items.length ? (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-2 pt-8 sm:p-3 sm:pt-10">
              <ItemThumbStack items={items} />
            </div>
          ) : null}
        </div>

        <div className="mt-2.5 px-0.5 sm:mt-3.5">
          <h2 className="line-clamp-1 text-sm font-bold tracking-tight text-zinc-950 transition-colors group-hover:text-[#34783f] sm:text-[15px]">
            {combo.title}
          </h2>
          <p className="mt-1 line-clamp-1 text-xs text-zinc-500 sm:text-sm">
            {itemNames || combo.summary || "구성 항목이 없습니다."}
          </p>

          <div className="mt-2 flex flex-col items-start gap-1.5 text-[11px] text-zinc-400 sm:mt-3 sm:text-xs @min-[15.5rem]:flex-row @min-[15.5rem]:items-center @min-[15.5rem]:justify-between @min-[15.5rem]:gap-3">
            <div className="flex w-full min-w-0 items-center gap-1.5 @min-[15.5rem]:w-auto">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                {initials(writerName)}
              </span>
              <span className="truncate font-medium text-zinc-600">{writerName}</span>
              <span className="shrink-0">·</span>
              <span className="shrink-0">{formatAge(combo.createdAt)}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2.5">
              <ReactionCount
                kind="like"
                count={combo.likeCount}
                mine={combo.liked}
                className="gap-1"
                iconClassName="h-3.5 w-3.5"
              />
              <ReactionCount
                kind="bookmark"
                count={combo.bookmarkCount}
                mine={combo.bookmarked}
                className="gap-1"
                iconClassName="h-3.5 w-3.5"
              />
              <span className="inline-flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">조회수</span>
                {formatCount(combo.viewCount)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

function ComboPreviewPanel({ combo }: { combo: Combos | null }) {
  if (!combo) {
    return (
      <aside className="hidden h-full items-center justify-center rounded-2xl bg-[#fbfaf7] p-8 text-center text-sm text-zinc-500 lg:flex">
        조합을 선택하면 상세 미리보기가 표시됩니다.
      </aside>
    );
  }

  const writerName = combo.writerName ?? "무명 셰프";
  const activeItems = combo.items ?? [];
  const tags = combo.tags?.length ? combo.tags.slice(0, 6) : ["조합"];

  // 좁은 화면에서는 목록 맨 아래로 밀려 카드와 함께 볼 수 없으므로 숨긴다. 카드를 누르면 상세로 간다.
  return (
    <aside className="hidden flex-col overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm lg:sticky lg:top-[92px] lg:flex">
      <div className="relative aspect-[2/1] overflow-hidden bg-[#f3efe8]">
        {combo.image ? (
          <Image
            src={combo.image}
            alt={combo.title || "레시피 조합 미리보기 이미지"}
            fill
            sizes={capImageDensity("(max-width: 1024px) 100vw, 380px")}
            className="object-cover"
          />
        ) : (
          <FoodImagePlaceholder />
        )}
        {/* 시간은 아래 숫자 칸에 있으므로 이미지 위에는 난이도만 둔다. */}
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-zinc-800 shadow-sm backdrop-blur">
          {combo.difficulty ?? "보통"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div>
          <h2 className="line-clamp-1 text-xl font-black tracking-tight text-zinc-950">
            {combo.title}
          </h2>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
              {initials(writerName)}
            </span>
            <span className="font-medium text-zinc-600">{writerName}</span>
            <span>·</span>
            <span>{formatAge(combo.createdAt)}</span>
          </div>
          {combo.summary ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">{combo.summary}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-4 divide-x divide-zinc-200/70 rounded-xl bg-[#fbfaf7] py-3 text-center text-[11px] text-zinc-500">
          <div>
            {/* 목록 카드와 같은 규칙: 내가 누른 것만 색을 채운다. */}
            <Heart
              className={cn(
                "mx-auto mb-1 h-4 w-4 text-zinc-700",
                combo.liked && "fill-red-400 text-red-400"
              )}
              aria-hidden="true"
            />
            <p className="text-sm font-bold text-zinc-900">{formatCount(combo.likeCount)}</p>
            <p>좋아요{combo.liked ? <span className="sr-only">(내가 누름)</span> : null}</p>
          </div>
          <div>
            <Bookmark
              className={cn(
                "mx-auto mb-1 h-4 w-4 text-zinc-700",
                combo.bookmarked && "fill-amber-400 text-amber-400"
              )}
              aria-hidden="true"
            />
            <p className="text-sm font-bold text-zinc-900">{formatCount(combo.bookmarkCount)}</p>
            <p>저장{combo.bookmarked ? <span className="sr-only">(내가 누름)</span> : null}</p>
          </div>
          <div>
            <Eye className="mx-auto mb-1 h-4 w-4 text-zinc-700" aria-hidden="true" />
            <p className="text-sm font-bold text-zinc-900">{formatCount(combo.viewCount)}</p>
            <p>조회수</p>
          </div>
          <div>
            <Clock3 className="mx-auto mb-1 h-4 w-4 text-zinc-700" aria-hidden="true" />
            <p className="text-sm font-bold text-zinc-900">
              {combo.timeMinutes ? `${combo.timeMinutes}분` : "-"}
            </p>
            <p>총 시간</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Link
              key={tag}
              href={`/combos?search=${encodeURIComponent(tag)}&searchField=tag_title`}
              className="rounded-full bg-[#f7f4ef] px-3 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-emerald-50 hover:text-[#34783f]"
            >
              #{tag}
            </Link>
          ))}
        </div>

        <div className="min-h-0">
          <h3 className="text-sm font-bold text-zinc-950">
            구성 레시피 <span className="text-[#3f914b]">{activeItems.length}</span>
          </h3>
          <div className="mt-2 max-h-[184px] space-y-1 overflow-y-auto overscroll-contain pr-1">
            {activeItems.length ? (
              activeItems.map((item, index) => {
                const title = itemTitle(item);
                const image = itemImage(item);
                // 레시피 항목은 상세 화면처럼 해당 레시피로 이동한다. 상품은 이동할 곳이 없다.
                const href =
                  item.type === "recipe" && item.recipeid ? `/recipes/${item.recipeid}` : null;
                const content = (
                  <>
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#f7f4ef]">
                      {image ? (
                        <Image src={image} alt={title} fill sizes="44px" className="object-cover" />
                      ) : (
                        <FoodImagePlaceholder size="sm" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-zinc-900">{title}</p>
                      <p className="line-clamp-1 text-xs text-zinc-500">
                        {item.summary || (item.type === "recipe" ? "레시피" : "상품")}
                      </p>
                    </div>
                    {href ? <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" /> : null}
                  </>
                );
                const rowClassName = "flex items-center gap-3 rounded-xl p-1.5";
                return href ? (
                  <Link
                    key={`${item.type}-${index}`}
                    href={href}
                    className={cn(rowClassName, "transition hover:bg-zinc-50")}
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={`${item.type}-${index}`} className={rowClassName}>
                    {content}
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl bg-[#fbfaf7] p-4 text-sm text-zinc-500">
                구성 항목이 없습니다.
              </p>
            )}
          </div>
        </div>

        <Button
          asChild
          className="mt-auto h-11 w-full rounded-full bg-[#34783f] font-bold text-white shadow-sm shadow-[#34783f]/20 hover:bg-[#2f6f39]"
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
  const [outOfRange, setOutOfRange] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [pageMeta, setPageMeta] = useState<Pick<ComboListResult, "limit" | "offset" | "total">>({
    limit: requestedPageSize,
    offset: 0,
    total: 0,
  });
  const [searchText, setSearchText] = useState(searchQuery ?? "");
  const [searchField, setSearchField] = useState<ComboSearchField>(fieldParam);

  useEffect(() => {
    setSearchText(searchQuery ?? "");
    setSearchField(fieldParam);
  }, [searchQuery, fieldParam]);

  useEffect(() => {
    let mounted = true;

    async function fetchCombos() {
      setLoading(true);
      setLoadError(false);
      setOutOfRange(false);
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
          setPageMeta({
            limit: data.limit,
            offset: data.offset,
            total: data.total,
          });
        }
      } catch (error) {
        // 목록 API의 404는 범위를 벗어난 page뿐이다. 장애가 아니므로 첫 페이지 안내로 처리한다.
        const pageOutOfRange = (error as ApiError).status === 404;
        if (!pageOutOfRange) console.error("조합 목록을 불러오지 못했습니다.", error);
        if (mounted) {
          setOutOfRange(pageOutOfRange);
          setLoadError(!pageOutOfRange);
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
    // 로그인 사용자가 바뀌면 내가 누른 좋아요·북마크 표시가 달라지므로 다시 받는다.
  }, [requestedPageSize, currentPage, searchQuery, fieldParam, sort, reloadKey, user?.id]);

  useEffect(() => {
    if (combos.length === 0) {
      setActiveComboId(null);
      return;
    }
    if (!activeComboId || !combos.some((combo) => combo.id === activeComboId)) {
      setActiveComboId(combos[0]?.id ?? null);
    }
  }, [combos, activeComboId]);

  const previewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => clearPreviewTimer(), []);

  function clearPreviewTimer() {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = null;
  }

  // 마우스로 카드를 스쳐 미리보기 패널로 갈 때 지나친 카드로 바뀌지 않게, 잠시 머문 카드만 보여준다.
  // 키보드 포커스는 바로 바꾼다.
  function previewHandlers(comboId: string): PreviewHandlers {
    return {
      onMouseEnter: () => {
        clearPreviewTimer();
        previewTimer.current = setTimeout(() => setActiveComboId(comboId), 150);
      },
      onMouseLeave: clearPreviewTimer,
      onFocus: () => {
        clearPreviewTimer();
        setActiveComboId(comboId);
      },
    };
  }

  const activeCombo = useMemo(() => {
    if (combos.length === 0) return null;
    return combos.find((combo) => combo.id === activeComboId) ?? combos[0] ?? null;
  }, [combos, activeComboId]);

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
  function retryCombos() {
    setLoading(true);
    setLoadError(false);
    setReloadKey((current) => current + 1);
  }

  const showPreview = !loading && !loadError && activeCombo !== null;
  const showTotal = !loading && !loadError && !outOfRange;
  const paginationQuery: Record<string, string> = {};
  if (searchQuery) {
    paginationQuery.search = searchQuery;
    paginationQuery.searchField = fieldParam;
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <section className="border-b border-zinc-100 bg-[#fbfaf7]">
        <div className="mx-auto w-full max-w-7xl px-5 py-10 md:py-12 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3f914b]">Combos</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-zinc-950 md:text-4xl">
                레시피 조합
              </h1>
              <p className="mt-2 text-sm text-zinc-500">여러 레시피를 하나로 조합해보세요.</p>
            </div>
            <Button
              className="h-11 self-start rounded-full bg-[#34783f] px-6 text-sm font-bold text-white shadow-sm shadow-[#34783f]/20 hover:bg-[#2f6f39] md:self-auto"
              onClick={handleCreate}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              조합 만들기
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4 md:justify-start">
            {showTotal ? (
              <p className="text-sm text-zinc-500">
                총{" "}
                <strong className="font-bold text-zinc-900">
                  {pageMeta.total.toLocaleString("ko-KR")}
                </strong>
                개
              </p>
            ) : null}
            <Tabs value={sort} onValueChange={(value) => setSort(parseSort(value))}>
              <TabsList className="h-10 rounded-full bg-zinc-100 p-1">
                {SORT_OPTIONS.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="h-8 rounded-full px-4 text-sm font-semibold text-zinc-500 hover:text-zinc-800 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm"
                  >
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="flex h-11 w-full items-center overflow-hidden rounded-full border border-zinc-200 bg-white transition focus-within:border-[#438e4d] focus-within:ring-4 focus-within:ring-[#438e4d]/10 md:max-w-[440px]"
          >
            <Select
              value={searchField}
              onValueChange={(value) => setSearchField(value as ComboSearchField)}
            >
              <SelectTrigger
                aria-label="검색 범위"
                className="h-full w-[7.5rem] shrink-0 rounded-none border-0 bg-transparent pl-5 pr-3 text-sm font-semibold text-zinc-700 shadow-none focus:ring-0"
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
            <span className="h-5 w-px shrink-0 bg-zinc-200" aria-hidden="true" />
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="조합 검색..."
              className="h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-4 text-sm shadow-none outline-none placeholder:text-zinc-400 focus-visible:ring-0"
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon"
              aria-label="검색"
              className="mr-1 h-9 w-9 shrink-0 rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
          </form>
        </div>

        <div
          className={
            showPreview ? "grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]" : "grid gap-8"
          }
        >
          <section className="flex flex-col gap-12">
            <Section
              name="combos.list"
              failed={!loading && loadError}
              outOfRange={!loading && outOfRange}
              title="조합 목록을 표시하지 못했습니다."
              resetKeys={[
                currentPage,
                requestedPageSize,
                searchQuery,
                fieldParam,
                sort,
                user?.id,
                loading,
              ]}
              onRetry={retryCombos}
            >
              {loading ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 xl:grid-cols-3">
                  {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="aspect-[4/3] rounded-xl bg-zinc-100 sm:rounded-2xl" />
                      <div className="mt-4 h-4 w-2/3 rounded bg-zinc-100" />
                      <div className="mt-2 h-3.5 w-1/2 rounded bg-zinc-100" />
                    </div>
                  ))}
                </div>
              ) : combos.length ? (
                <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-5 sm:gap-y-10 xl:grid-cols-3">
                  {combos.map((combo) => (
                    <ComboGridCard
                      key={combo.id}
                      combo={combo}
                      isActive={combo.id === activeCombo?.id}
                      previewHandlers={previewHandlers(combo.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center rounded-2xl bg-[#fbfaf7] px-6 py-20 text-center">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#7c9a80] ring-1 ring-zinc-200">
                    <SearchX className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-sm font-semibold text-zinc-800">
                    조건에 맞는 조합이 없습니다.
                  </p>
                  <p className="mt-1.5 text-sm text-zinc-500">
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
            </Section>
          </section>

          {showPreview ? (
            <Section
              name="combos.preview"
              title="조합 미리보기를 표시하지 못했습니다."
              resetKeys={[activeCombo.id]}
              onRetry={retryCombos}
            >
              <ComboPreviewPanel combo={activeCombo} />
            </Section>
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
