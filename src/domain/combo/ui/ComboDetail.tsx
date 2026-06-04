import {
  Bookmark,
  ChefHat,
  ChevronRight,
  Clock3,
  Layers,
  Link2,
  MoreHorizontal,
  Package,
  Quote,
  Wrench,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import ComboDeleteButton from "@/app/combos/components/DeleteButton";
import ComboUpdateButton from "@/app/combos/components/UpdateButton";
import ComboLikeBookmarkButton from "@/app/combos/ui/likebookmarkButton";
import ViewCount from "@/domain/view/ui/ViewCount.client";
import { CopyClipButton } from "@/lib/shareButton/copycliep";
import KakaoShareButton from "@/lib/shareButton/kakaosharebutton";
import type { Combos } from "../types";
import ComboToolsPanel from "./ComboToolsPanel";

function formatMinutes(value: number | null | undefined) {
  if (!value || value <= 0) return null;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours && minutes) return `${hours}시간 ${minutes}분`;
  if (hours) return `${hours}시간`;
  return `${minutes}분`;
}

function formatDate(value: Date) {
  return value.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

function initials(name: string | null | undefined) {
  return name?.trim().slice(0, 1).toUpperCase() || "U";
}

function uniqueChips(combo: Combos) {
  const tags = combo.tags?.filter((tag) => typeof tag === "string" && tag.trim().length > 0) ?? [];
  return Array.from(new Set(tags.map((chip) => chip.trim()).filter(Boolean)));
}

export default function ComboDetail({
  combo,
  isAuthor = false,
}: {
  combo: Combos;
  isAuthor?: boolean;
}) {
  const chips = uniqueChips(combo);
  const mainImage = combo.image ?? null;
  const steps =
    combo.steps?.map((step) => step.description.trim()).filter((step) => step.length > 0) ?? [];
  const items = combo.items ?? [];
  const recipeItems = items.filter((item) => item.type === "recipe");
  const productItems = items.filter((item) => item.type === "product");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
  const currentUrl = `${baseUrl}/combos/${combo.id}`;
  const shareImageUrl = mainImage ?? "";
  const timeLabel = formatMinutes(combo.timeMinutes);
  const toolRequiredLabel =
    combo.toolRequired || (combo.tools?.length ?? 0) > 0 ? "도구 필요" : "도구 필요 없음";
  const writerName = combo.writerName ?? "무명 셰프";

  return (
    <article className="space-y-10">
      <nav className="flex items-center gap-2 text-sm font-medium text-zinc-500">
        <Link href="/" className="transition hover:text-[#15933d]">
          홈
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/combos" className="transition hover:text-[#15933d]">
          조합
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="line-clamp-1 text-zinc-700">{combo.title}</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
        <div className="space-y-5">
          <div className="relative aspect-[4/2.7] overflow-hidden rounded-lg bg-emerald-50">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={combo.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 560px"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-medium text-emerald-700">
                이미지가 없습니다.
              </div>
            )}

            <div className="absolute inset-0 grid place-items-center bg-black/5">
              <span className="grid h-14 w-14 place-items-center rounded-full border-2 border-white/90 bg-white/20 text-white shadow-sm backdrop-blur-sm">
                <Layers className="h-7 w-7" />
              </span>
            </div>

            <span className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-[#15933d] shadow-sm">
              <Bookmark className="h-5 w-5" />
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap gap-2">
            {combo.difficulty ? (
              <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
                난이도 {combo.difficulty}
              </span>
            ) : null}
            {timeLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
                <Clock3 className="h-4 w-4" />
                소요 {timeLabel}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
              <Wrench className="h-4 w-4" />
              {toolRequiredLabel}
            </span>
          </div>

          <h1 className="mt-7 text-4xl font-black tracking-tight text-zinc-950">{combo.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
              {initials(writerName)}
            </span>
            <span>{writerName}</span>
            <span>·</span>
            <span>{formatDate(combo.createdAt)}</span>
            <span>·</span>
            <span>
              조회 <ViewCount type="combo" id={combo.id} initialCount={combo.viewCount ?? 0} />
            </span>
          </div>

          {combo.summary ? (
            <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
                <Quote className="h-5 w-5" />
                조합 포인트
              </div>
              <p className="whitespace-pre-line text-sm leading-7 text-zinc-700">{combo.summary}</p>
            </div>
          ) : null}

          {chips.length ? (
            <div className="mt-7 space-y-3">
              <p className="text-sm font-bold text-zinc-700">태그</p>
              <div className="flex flex-wrap gap-2">
                {chips.slice(0, 5).map((chip) => (
                  <Link
                    key={chip}
                    href={`/combos?search=${encodeURIComponent(chip)}&searchField=tag_title`}
                    className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    {chip}
                  </Link>
                ))}
                {chips.length > 5 ? (
                  <span className="grid h-8 w-8 place-items-center rounded-full border border-zinc-200 text-zinc-500">
                    <MoreHorizontal className="h-4 w-4" />
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-9 flex flex-wrap items-center justify-between gap-4">
            <ComboLikeBookmarkButton combo={combo} />
          </div>

          {isAuthor ? (
            <div className="mt-5 flex gap-2">
              <ComboUpdateButton id={combo.id} />
              <ComboDeleteButton id={combo.id} />
            </div>
          ) : null}
        </div>
      </section>

      <div className="border-t border-zinc-200" />

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-xl font-black text-zinc-950">
            <Layers className="h-5 w-5 text-[#15933d]" />
            조합 구성
          </h2>
          <span className="text-sm font-medium text-zinc-500">총 {items.length}개</span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center text-sm font-medium text-zinc-500">
            등록된 조합 아이템이 없습니다.
          </div>
        ) : (
          <div className="space-y-7">
            {recipeItems.length ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <ChefHat className="h-4 w-4 text-[#15933d]" />
                    레시피 구성
                  </p>
                  <span className="text-sm font-medium text-zinc-500">{recipeItems.length}개</span>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {recipeItems.map((item, index) => {
                    if (item.type !== "recipe") return null;
                    const title = item.title || item.summary || "레시피 이름 없음";
                    const summary = item.title ? item.summary : null;
                    const href = item.recipeid ? `/recipes/${item.recipeid}` : null;

                    const inner = (
                      <>
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-emerald-50">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-700">
                              <ChefHat className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-bold text-zinc-950">{title}</p>
                          {summary ? (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                              {summary}
                            </p>
                          ) : null}
                        </div>
                        {href ? <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300" /> : null}
                      </>
                    );

                    return href ? (
                      <Link
                        key={`${item.recipeid}-${index}`}
                        href={href}
                        className="flex min-h-[96px] items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50/40"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <div
                        key={`recipe-${index}`}
                        className="flex min-h-[96px] items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
                      >
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {productItems.length ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <Package className="h-4 w-4 text-[#15933d]" />
                    상품 구성
                  </p>
                  <span className="text-sm font-medium text-zinc-500">{productItems.length}개</span>
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                  {productItems.map((item, index) => {
                    if (item.type !== "product") return null;
                    const title = item.productName || "상품 이름 없음";
                    const summary = item.summary || "설명이 없습니다.";

                    return (
                      <div
                        key={`${item.productName}-${index}`}
                        className="flex min-h-[96px] items-center gap-4 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-emerald-50">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-700">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-1 font-bold text-zinc-950">{title}</p>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">
                            {summary}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <ComboToolsPanel tools={combo.tools} />

      {steps.length > 0 ? (
        <section className="border-t border-zinc-200 pt-8">
          <h2 className="flex items-center gap-3 text-xl font-black text-zinc-950">
            <ChefHat className="h-5 w-5 text-[#15933d]" />
            조리 단계
          </h2>

          <ol className="mt-6 space-y-4">
            {steps.map((step, index) => (
              <li key={`${index}-${step.slice(0, 12)}`} className="grid gap-4 sm:grid-cols-[44px_1fr]">
                <div className="flex justify-center sm:block">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[#15933d] text-sm font-black text-white">
                    {index + 1}
                  </span>
                </div>
                <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                  <h3 className="font-black text-zinc-950">Step {index + 1}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-600">{step}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div />
        <div className="grid gap-4">
          <KakaoShareButton
            contentinfo={{ title: combo.title, description: combo.summary }}
            imageUrl={shareImageUrl}
            url={currentUrl}
            label="카카오톡으로 공유"
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-lg bg-[#fee24c] px-5 text-sm font-black text-zinc-900 transition hover:bg-[#f7d93e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="rounded-full bg-zinc-900 px-2 py-1 text-xs font-black text-[#fee24c]">
              TALK
            </span>
            카카오톡으로 공유
          </KakaoShareButton>
          <CopyClipButton
            currentUrl={currentUrl}
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <Link2 className="h-5 w-5" />
            URL 복사
          </CopyClipButton>
        </div>
      </section>
    </article>
  );
}
