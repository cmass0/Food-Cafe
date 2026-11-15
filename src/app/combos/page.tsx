"use client";

import { ChevronRight, Plus, Search, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import FoodCardFacts from "@/components/food-card/FoodCardFacts";
import FoodCardFooter, { FoodCardReactions } from "@/components/food-card/FoodCardFooter";
import FoodImagePlaceholder from "@/components/FoodImagePlaceholder";
import ListPageHeader from "@/components/ListPageHeader";
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

function itemTitle(item: ComboItem): string {
  return item.type === "recipe" ? item.title || "레시피" : item.productName || "상품";
}

function itemImage(item: ComboItem): string | null {
  return item.image ?? null;
}

// 조합이 무엇으로 이루어졌는지 항목 이름을 + 로 잇는다. 사진 위에 작은 원을 겹치는 대신 글자로 보여준다.
function ItemNames({ items }: { items: ComboItem[] }) {
  return (
    <>
      {items.map((item, index) => (
        <Fragment key={`${item.type}-${index}`}>
          {index > 0 ? (
            <>
              <span className="mx-1 text-[#34783f]" aria-hidden="true">
                +
              </span>
              <span className="sr-only">, </span>
            </>
          ) : null}
          {itemTitle(item)}
        </Fragment>
      ))}
    </>
  );
}

type PreviewHandlers = Pick<
  React.ComponentProps<typeof Link>,
  "onMouseEnter" | "onMouseLeave" | "onFocus"
>;

// 카드를 누르면 상세 화면으로 가고, 올려 두거나 키보드로 고르면 옆 미리보기가 바뀐다.
// 카드는 사진·제목·구성·작성자만 보여준다. 조리 시간·난이도는 미리보기와 상세 화면에서, 작성일은 상세 화면에서 본다.
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

  return (
    <article className="group">
      <Link
        href={`/combos/${combo.id}`}
        prefetch={false}
        {...previewHandlers}
        className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#34783f] focus-visible:ring-offset-4"
      >
        <div
          className={cn(
            "relative aspect-[4/3] overflow-hidden rounded-lg bg-[#f3efe8]",
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
              className="object-cover"
            />
          ) : (
            <FoodImagePlaceholder />
          )}
        </div>

        <div className="mt-3">
          <h2 className="line-clamp-1 text-[15px] font-semibold tracking-tight text-zinc-900 decoration-zinc-300 underline-offset-4 group-hover:underline sm:text-base">
            {combo.title}
          </h2>
          <p className="mt-1 line-clamp-1 text-xs text-zinc-500 sm:text-[13px]">
            {items.length ? <ItemNames items={items} /> : combo.summary || "구성 항목이 없습니다."}
          </p>

          <FoodCardFooter
            className="mt-2.5"
            writerName={writerName}
            likeCount={combo.likeCount}
            liked={combo.liked}
          />
        </div>
      </Link>
    </article>
  );
}

function ComboPreviewPanel({ combo }: { combo: Combos | null }) {
  if (!combo) {
    return (
      <aside className="hidden h-full items-center justify-center rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 lg:flex">
        조합을 선택하면 상세 미리보기가 표시됩니다.
      </aside>
    );
  }

  const writerName = combo.writerName ?? "무명 셰프";
  const activeItems = combo.items ?? [];
  const tags = combo.tags?.length ? combo.tags.slice(0, 6) : ["조합"];

  // 좁은 화면에서는 목록 맨 아래로 밀려 카드와 함께 볼 수 없으므로 숨긴다. 카드를 누르면 상세로 간다.
  return (
    <aside className="hidden flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white lg:sticky lg:top-[92px] lg:flex">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#f3efe8]">
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
      </div>

      <div className="flex flex-1 flex-col p-5">
        <FoodCardFacts
          lead={
            activeItems.length ? (
              <span className="font-semibold text-[#34783f]">{activeItems.length}가지 조합</span>
            ) : null
          }
          timeMinutes={combo.timeMinutes}
          difficulty={combo.difficulty}
        />
        <h2 className="mt-1.5 line-clamp-2 text-xl font-bold leading-snug tracking-tight text-zinc-900">
          {combo.title}
        </h2>
        <p className="mt-1.5 text-xs font-medium text-zinc-600">{writerName}</p>
        {combo.summary ? (
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">{combo.summary}</p>
        ) : null}

        <FoodCardReactions
          className="mt-4 text-xs text-zinc-500"
          likeCount={combo.likeCount}
          liked={combo.liked}
          bookmarkCount={combo.bookmarkCount}
          bookmarked={combo.bookmarked}
          viewCount={combo.viewCount}
        />

        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag}>
              <Link
                href={`/combos?search=${encodeURIComponent(tag)}&searchField=tag_title`}
                className="inline-block rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-[#34783f]/10 hover:text-[#34783f]"
              >
                #{tag}
              </Link>
            </li>
          ))}
        </ul>

        <section className="mt-5 min-h-0 border-t border-zinc-100 pt-4">
          <h3 className="text-sm font-semibold text-zinc-900">
            구성 <span className="ml-0.5 text-zinc-400">{activeItems.length}</span>
          </h3>
          {activeItems.length ? (
            <ol className="mt-3 max-h-[208px] space-y-3 overflow-y-auto overscroll-contain pr-1">
              {activeItems.map((item, index) => {
                const title = itemTitle(item);
                const image = itemImage(item);
                // 레시피 항목은 상세 화면처럼 해당 레시피로 이동한다. 상품은 이동할 곳이 없다.
                const href =
                  item.type === "recipe" && item.recipeid ? `/recipes/${item.recipeid}` : null;
                const content = (
                  <>
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[#f7f4ef]">
                      {image ? (
                        <Image src={image} alt="" fill sizes="44px" className="object-cover" />
                      ) : (
                        <FoodImagePlaceholder size="sm" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-zinc-900">{title}</p>
                      <p className="line-clamp-1 text-xs text-zinc-500">
                        {item.summary || (item.type === "recipe" ? "레시피" : "상품")}
                      </p>
                    </div>
                    {href ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" aria-hidden="true" />
                    ) : null}
                  </>
                );
                const rowClassName = "flex items-center gap-3 rounded-lg p-1";
                return (
                  <li key={`${item.type}-${index}`} className="relative">
                    {/* 항목 사이를 + 로 이어 "합쳐서 한 끼"라는 조합의 뜻을 보여준다. */}
                    {index > 0 ? (
                      <span
                        className="absolute -top-[15px] left-[16px] z-10 grid h-5 w-5 place-items-center rounded-full bg-white text-[#34783f] ring-1 ring-zinc-200"
                        aria-hidden="true"
                      >
                        <Plus className="h-3 w-3" strokeWidth={2.5} />
                      </span>
                    ) : null}
                    {href ? (
                      <Link href={href} className={cn(rowClassName, "transition hover:bg-zinc-50")}>
                        {content}
                      </Link>
                    ) : (
                      <div className={rowClassName}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-3 rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">
              구성 항목이 없습니다.
            </p>
          )}
        </section>

        <Button
          asChild
          className="mt-5 h-11 w-full rounded-lg bg-[#34783f] font-semibold text-white hover:bg-[#2f6f39]"
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
      <ListPageHeader
        title="레시피 조합"
        description="여러 레시피를 하나로 조합해보세요."
        action={
          <Button
            className="h-10 self-start rounded-lg bg-[#34783f] px-4 text-sm font-semibold text-white hover:bg-[#2f6f39] md:self-auto"
            onClick={handleCreate}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            조합 만들기
          </Button>
        }
      />

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
                      <div className="aspect-[4/3] rounded-lg bg-zinc-100" />
                      <div className="mt-3 h-4 w-2/3 rounded bg-zinc-100" />
                      <div className="mt-2 h-3.5 w-1/2 rounded bg-zinc-100" />
                      <div className="mt-3 h-3 w-1/3 rounded bg-zinc-100" />
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
