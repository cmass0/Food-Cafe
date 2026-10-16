import {
  ChefHat,
  ChevronRight,
  Clock3,
  Hash,
  Lightbulb,
  Link2,
  MoreHorizontal,
  Quote,
  Sprout,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import DeleteRecipeButton from "@/app/recipes/components/DeleteRecipeButton";
import UpdateRecipeButton from "@/app/recipes/components/UpdateRecipeButton";
import LikeBookmarkButton from "@/app/recipes/ui/likebookmarkButton";
import ViewCount from "@/components/ViewCount.client";
import { CopyClipButton } from "@/components/share/CopyClipButton";
import KakaoShareButton from "@/components/share/KakaoShareButton";
import { getRecipeCategoryKey, getRecipeCategoryLabel } from "@/domain/recipe/category";
import type { Recipe } from "@/domain/recipe/types";
import { formatInKoreanTime } from "@/lib/format-date";
import { formatMinutes } from "@/lib/format-duration";
import { capImageDensity } from "@/lib/image-sizes";
import RecipeImageGallery from "./RecipeImageGallery";
import RecipeIngredientsPanel from "./RecipeIngredientsPanel";
import RecipeToolsPanel from "./RecipeToolsPanel";

function formatDate(value: Date) {
  return formatInKoreanTime(value, { month: "long", day: "numeric" });
}

function initials(name: string | null | undefined) {
  return name?.trim().slice(0, 1).toUpperCase() || "U";
}

// 카테고리는 태그가 아니라 태그 검색으로 찾을 수 없다. 카테고리 칩은 카테고리 목록으로, 태그 칩은 태그 검색으로 보낸다.
// 필터가 없는 카테고리("기타" 등)는 칩으로 보여주지 않는다.
function recipeChips(recipe: Recipe) {
  const chips = new Map<string, string>();
  const categoryKey = getRecipeCategoryKey(recipe.category);
  if (categoryKey) {
    chips.set(getRecipeCategoryLabel(categoryKey), `/recipes?category=${categoryKey}`);
  }
  for (const tag of recipe.tags ?? []) {
    const label = typeof tag === "string" ? tag.trim() : "";
    if (label && !chips.has(label)) {
      chips.set(label, `/recipes?search=${encodeURIComponent(label)}&searchField=tag_title`);
    }
  }
  return Array.from(chips, ([label, href]) => ({ label, href }));
}

function recipeImages(recipe: Recipe) {
  if (recipe.images.length > 0) return recipe.images;
  return recipe.image ? [recipe.image] : [];
}

export default function RecipeDetail({
  recipe,
  canEdit = false,
  canDelete = false,
}: {
  recipe: Recipe;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const chips = recipeChips(recipe);
  const images = recipeImages(recipe);
  const mainImage = images[0] ?? null;
  const steps =
    recipe.steps?.map((step) => step.description.trim()).filter((step) => step.length > 0) ?? [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "";
  const currentUrl = `${baseUrl}/recipes/${recipe.id}`;
  const shareImageUrl = mainImage ?? "";
  const timeLabel = formatMinutes(recipe.timeMinutes);
  const writerName = recipe.writerName ?? "무명 셰프";
  const chefTip = recipe.chefTip?.trim();

  return (
    <article className="space-y-10">
      <nav className="flex items-center gap-2 text-sm font-medium text-zinc-500">
        <Link href="/" className="transition hover:text-[#34783f]">
          홈
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/recipes" className="transition hover:text-[#34783f]">
          레시피
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="line-clamp-1 text-zinc-700">{recipe.title}</span>
      </nav>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
        <RecipeImageGallery images={images} title={recipe.title} />

        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap gap-2">
            {recipe.difficulty ? (
              <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
                난이도 {recipe.difficulty}
              </span>
            ) : null}
            {timeLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
                <Clock3 className="h-4 w-4" />
                소요 {timeLabel}
              </span>
            ) : null}
            {recipe.servings ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700">
                <Users className="h-4 w-4" />
                {recipe.servings}인분
              </span>
            ) : null}
          </div>

          <h1 className="mt-7 text-4xl font-black tracking-tight text-zinc-950">{recipe.title}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-600">
              {initials(writerName)}
            </span>
            <span>{writerName}</span>
            <span>·</span>
            <span>{formatDate(recipe.createdAt)}</span>
            <span>·</span>
            <span>
              조회 <ViewCount type="recipe" id={recipe.id} initialCount={recipe.viewCount ?? 0} />
            </span>
          </div>

          {recipe.summary ? (
            <div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/40 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-bold text-emerald-700">
                <Quote className="h-5 w-5" />
                요약
              </div>
              <p className="whitespace-pre-line text-sm leading-7 text-zinc-700">
                {recipe.summary}
              </p>
            </div>
          ) : null}

          {chips.length ? (
            <div className="mt-7 space-y-3">
              <p className="text-sm font-bold text-zinc-700">태그</p>
              <div className="flex flex-wrap gap-2">
                {chips.slice(0, 5).map((chip) => (
                  <Link
                    key={chip.label}
                    href={chip.href}
                    className="rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    {chip.label}
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
            <LikeBookmarkButton recipe={recipe} />
          </div>

          {canEdit || canDelete ? (
            <div className="mt-5 flex gap-2">
              {canEdit ? <UpdateRecipeButton id={recipe.id} /> : null}
              {canDelete ? <DeleteRecipeButton recipeId={recipe.id} /> : null}
            </div>
          ) : null}
        </div>
      </section>

      <div className="border-t border-zinc-200" />

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-3 text-xl font-black text-zinc-950">
            <Sprout className="h-5 w-5 text-[#15933d]" />
            재료
          </h2>
          <span className="text-sm font-medium text-zinc-500">
            총 {recipe.ingredients?.length ?? 0}개
          </span>
        </div>
        <RecipeIngredientsPanel ingredients={recipe.ingredients} />
      </section>

      <RecipeToolsPanel tools={recipe.tools} />

      {steps.length > 0 ? (
        <section className="border-t border-zinc-200 pt-8">
          <h2 className="flex items-center gap-3 text-xl font-black text-zinc-950">
            <ChefHat className="h-5 w-5 text-[#15933d]" />
            조리 단계
          </h2>

          <ol className="mt-6 space-y-4">
            {steps.map((step, index) => {
              const stepImage = images.length > 0 ? images[index % images.length] : null;

              return (
                <li
                  key={`${index}-${step.slice(0, 12)}`}
                  className="grid gap-4 sm:grid-cols-[44px_1fr]"
                >
                  <div className="flex justify-center sm:block">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#34783f] text-sm font-black text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div className="grid gap-5 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm sm:grid-cols-[190px_1fr] sm:items-center">
                    <div className="relative aspect-[16/9] overflow-hidden rounded-md bg-emerald-50">
                      {stepImage ? (
                        <Image
                          src={stepImage}
                          alt={`Step ${index + 1}`}
                          fill
                          sizes={capImageDensity("190px")}
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-700">
                          Step {index + 1}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-black text-zinc-950">Step {index + 1}</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-zinc-600">
                        {step}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {chefTip ? (
          <div className="relative overflow-hidden rounded-lg border border-emerald-100 bg-emerald-50 p-6">
            <div className="relative z-10 max-w-[58%] space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-black text-emerald-800">
                <Lightbulb className="h-5 w-5" />
                셰프의 팁
              </h2>
              <p className="whitespace-pre-line text-sm leading-7 text-zinc-700">{chefTip}</p>
            </div>
            {mainImage ? (
              <Image
                src={mainImage}
                alt=""
                fill
                sizes={capImageDensity("600px")}
                className="object-cover opacity-20"
              />
            ) : null}
          </div>
        ) : (
          <div />
        )}

        <div className="grid gap-4">
          <KakaoShareButton
            contentinfo={{ title: recipe.title, description: recipe.summary }}
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
          {/* 조합 작성 화면의 "레시피 ID" 칸에 붙여 넣는 값 */}
          <CopyClipButton
            currentUrl={recipe.id}
            label="레시피 ID"
            className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-lg border border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
          >
            <Hash className="h-5 w-5" />
            레시피 ID 복사
          </CopyClipButton>
        </div>
      </section>
    </article>
  );
}
