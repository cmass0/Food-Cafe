import { Bookmark, Eye, Heart, Puzzle, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Section from "@/components/status/Section";
import type { ComboItems, ComboListResult, Combos } from "@/domain/combo/types";
import { PaginationComponent } from "@/components/Pagination";
import { capImageDensity } from "@/lib/image-sizes";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

type Props = {
  combos: ComboListResult;
  searchParams: Record<string, string | string[] | undefined>;
  queryText: string;
  viewMode: ViewMode;
  error?: boolean;
  /** 이 섹션의 comboPage가 결과 범위를 벗어났다. */
  outOfRange?: boolean;
};

function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function itemImage(item: ComboItems): string | null {
  return item.image ?? null;
}

function buildMoreHref(queryText: string): string {
  const params = new URLSearchParams();
  if (queryText) {
    params.set("search", queryText);
    params.set("searchField", "tag_title");
  }
  const query = params.toString();
  return query ? `/combos?${query}` : "/combos";
}

function imageSlots(combo: Combos): string[] {
  const slots = [combo.image, ...(combo.items ?? []).map((item) => itemImage(item))].filter(
    (image): image is string => Boolean(image)
  );

  return Array.from(new Set(slots)).slice(0, 2);
}

function ComboImageStrip({ combo }: { combo: Combos }) {
  const slots = imageSlots(combo);

  if (slots.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-emerald-50 text-sm font-bold text-emerald-700">
        이미지 준비 중
      </div>
    );
  }

  return (
    <div className="relative grid h-full w-full grid-cols-2 overflow-hidden">
      {slots.map((image, index) => (
        <div key={image} className={cn("relative", slots.length === 1 && "col-span-2")}>
          <Image
            src={image}
            alt={`${combo.title} 이미지 ${index + 1}`}
            fill
            sizes={capImageDensity("(max-width: 767px) 50vw, 33vw")}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
      ))}
      {slots.length > 1 ? (
        <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-xl font-medium text-zinc-700 shadow-sm">
          +
        </span>
      ) : null}
    </div>
  );
}

function ComboResultCard({ combo, viewMode }: { combo: Combos; viewMode: ViewMode }) {
  return (
    <article
      className={cn(
        "group min-w-0 bg-white md:overflow-hidden md:rounded-lg md:border md:border-zinc-200 md:shadow-sm md:transition-[transform,box-shadow] md:hover:-translate-y-0.5 md:hover:shadow-md",
        viewMode === "list" && "md:grid md:grid-cols-[320px_1fr]"
      )}
    >
      <Link
        href={`/combos/${combo.id}`}
        prefetch={false}
        className={cn(
          "relative block aspect-square overflow-hidden rounded-lg bg-emerald-50 md:aspect-[2.65/1] md:rounded-none",
          viewMode === "list" && "md:aspect-auto md:min-h-[150px]"
        )}
        aria-label={`${combo.title} 상세 보기`}
      >
        <ComboImageStrip combo={combo} />
      </Link>

      <div className="flex min-w-0 flex-col gap-1.5 pt-2 md:gap-3 md:p-4">
        <Link href={`/combos/${combo.id}`} prefetch={false}>
          <h3 className="truncate text-sm font-bold tracking-tight text-zinc-950 md:text-base md:font-black">
            {combo.title}
          </h3>
        </Link>
        <p className="truncate text-xs font-medium text-zinc-500 md:text-sm">
          {combo.summary || "함께 즐길 레시피 조합입니다."}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 text-xs font-medium text-zinc-500">
          <span className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden="true" />
              <span className="sr-only">좋아요 </span>
              {formatCount(combo.likeCount)}
            </span>
            <span className="hidden items-center gap-1 md:inline-flex">
              <Eye className="h-4 w-4" />
              {formatCount(combo.viewCount)}
            </span>
          </span>
          <span className="hidden items-center gap-1 rounded-md border border-zinc-200 px-2.5 py-1 font-bold text-zinc-600 md:inline-flex">
            <Bookmark className="h-4 w-4" />
            {formatCount(combo.bookmarkCount)}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function SearchResultCombos({
  combos,
  searchParams,
  queryText,
  viewMode,
  error = false,
  outOfRange = false,
}: Props) {
  const comboItems = combos.items;
  const currentPage = Number(searchParams.comboPage) || 1;
  const gridClass =
    viewMode === "list"
      ? "grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-1 md:gap-4"
      : "grid grid-cols-2 gap-x-3 gap-y-5 md:grid-cols-1 md:gap-4 lg:grid-cols-3";

  return (
    <section>
      <header className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-emerald-50 text-[#34783f]">
            <Puzzle className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-black tracking-tight text-zinc-950">레시피 조합</h2>
          <span className="text-base font-black text-[#34783f]">{formatCount(combos.total)}</span>
        </div>
        <Link
          href={buildMoreHref(queryText)}
          prefetch={false}
          className="text-sm font-bold text-zinc-500 transition hover:text-[#34783f]"
        >
          더보기
        </Link>
      </header>

      <Section
        name="search.combos"
        failed={error}
        outOfRange={outOfRange}
        pageParam="comboPage"
        title="조합 검색 결과를 표시하지 못했습니다."
        resetKeys={[queryText, currentPage, viewMode, String(searchParams.sort ?? "")]}
      >
        {comboItems.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-center">
            <SearchX className="h-7 w-7 text-zinc-300" />
            <p className="mt-3 text-sm font-bold text-zinc-700">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className={gridClass}>
            {comboItems.map((combo) => (
              <ComboResultCard key={combo.id} combo={combo} viewMode={viewMode} />
            ))}
          </div>
        )}

        {combos.total > 0 ? (
          <div className="mt-5">
            <PaginationComponent
              basePath="/search"
              page={currentPage}
              pageItemSize={combos.limit}
              blockSize={5}
              total={combos.total}
              query={searchParams}
              pageParam="comboPage"
              scroll={false}
            />
          </div>
        ) : null}
      </Section>
    </section>
  );
}
