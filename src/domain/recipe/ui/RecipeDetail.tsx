import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AuthorProfileMenu from "@/components/user/AuthorProfileMenu";
import ViewCount from "@/domain/view/ui/ViewCount.client";

import DeleteRecipeButton from "@/app/recipes/components/DeleteRecipeButton";
import UpdateRecipeButton from "@/app/recipes/components/UpdateRecipeButton";
import LikeBookmarkButton from "@/app/recipes/ui/likebookmarkButton";

import KakaoShareButton from "@/lib/shareButton/kakaosharebutton";
import Image from "next/image";
import type { Recipe } from "../types";
import { getDifficultyMeta } from "./difficultyMeta";
import { CopyClipButton } from "./RecipeClip";
import RecipeIngredientsPanel from "./RecipeIngredientsPanel";

function formatMinutes(value: number | null | undefined) {
  if (!value || value <= 0) return null;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours && minutes) return `${hours}시간 ${minutes}분`;
  if (hours) return `${hours}시간`;
  return `${minutes}분`;
}

export default async function RecipeDetail({
  recipe,
  isAuthor = false,
}: {
  recipe: Recipe;
  isAuthor?: boolean;
}) {
  const tags = recipe.tags?.filter((tag) => typeof tag === "string" && tag.length > 0) ?? [];
  const chips = recipe.category ? [recipe.category, ...tags] : tags;
  const tools = recipe.tools?.filter((tool) => tool.length > 0) ?? [];
  const steps =
    recipe.steps?.map((step) => step.description).filter((step) => step.length > 0) ?? [];
  const ingredientCount = recipe.ingredients?.length ?? 0;
  const currentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/recipes/${recipe.id}`;
  const shareImageUrl = recipe.image ? recipe.image : "";

  const timeLabel = formatMinutes(recipe.timeMinutes);
  const metaChips = [
    recipe.difficulty ? `난이도 ${recipe.difficulty}` : null,
    timeLabel ? `소요 ${timeLabel}` : null,
    recipe.servings ? `${recipe.servings}인분` : null,
  ].filter(Boolean) as string[];

  const createdLabel = recipe.createdAt.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return (
    <article className="space-y-10">
      {/* 헤더 */}
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">레시피</p>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">레시피 상세</h1>
        <p className="text-sm text-muted-foreground">재료와 조리 단계를 한눈에 확인하세요.</p>
      </header>

      {/* 상단 카드 섹션 */}
      <section className="rounded-3xl border border-emerald-100/70 bg-white/80 p-6 shadow-sm backdrop-blur">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {/* 이미지 */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/40">
            {recipe.image ? (
              <Image
                src={recipe.image}
                alt={recipe.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                이미지가 없습니다.
              </div>
            )}
          </div>

          {/* 기본정보 */}
          <div className="flex flex-col gap-4">
            {/* 메타 태그 */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap gap-2 text-xs text-emerald-700">
                {metaChips.map((chip) => (
                  <Badge
                    key={chip}
                    variant="outline"
                    className="rounded-full border-emerald-200/80 bg-emerald-50 text-emerald-800"
                  >
                    {chip}
                  </Badge>
                ))}
              </div>
            </div>

            {/* 제목 & 작성자 */}
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold text-slate-900">{recipe.title}</h2>
              <p className="text-sm text-muted-foreground">
                <AuthorProfileMenu name={recipe.writerName} userId={recipe.writerUid} /> ·{" "}
                {createdLabel} · 조회{" "}
                <ViewCount type="recipe" id={recipe.id} initialCount={recipe.viewCount ?? 0} />
              </p>
            </div>

            {/* 요약 */}
            {recipe.summary ? (
              <div className="rounded-2xl border border-emerald-100/70 bg-emerald-50/70 p-4 text-sm leading-relaxed text-emerald-950">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  요약
                </p>
                <p className="whitespace-pre-line">{recipe.summary}</p>
              </div>
            ) : null}

            {/* 태그 */}
            {chips.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">태그</p>
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip, idx) => (
                    <Badge
                      key={`${chip}-${idx}`}
                      variant="outline"
                      className="rounded-full border-emerald-200/80 bg-white text-emerald-700"
                    >
                      {chip}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}
            {/* 도구 */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">사용 도구</p>
              <div className="flex flex-wrap gap-2">
                {tools.length ? (
                  tools.map((tool) => (
                    <Badge
                      key={tool}
                      variant="outline"
                      className="rounded-full border-emerald-200/80 bg-white text-emerald-700"
                    >
                      {tool}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">도구가 없습니다.</span>
                )}
              </div>
            </div>

            {/* 좋아요/북마크 & 수정/삭제 버튼 */}
            <div className="flex items-center justify-between mt-5">
              <LikeBookmarkButton recipe={recipe} />
              {isAuthor && (
                <div className="flex gap-2">
                  <UpdateRecipeButton id={recipe.id} />
                  <DeleteRecipeButton recipeId={recipe.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      {/* 재료  */}
      <section>
        <RecipeIngredientsPanel ingredients={recipe.ingredients} />
      </section>

      {/* 조리 단계 섹션 */}
      {steps.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">조리 단계</h2>
          <div className="rounded-3xl border border-emerald-100/70 bg-white/80 p-6 shadow-sm">
            {/* 난이도 툴팁 포함 메타 뱃지 */}
            <div className="mb-4 flex flex-wrap gap-2 text-xs text-emerald-700">
              {recipe.difficulty ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className="cursor-help rounded-full border-emerald-200/80 bg-emerald-50 text-emerald-800"
                      >
                        난이도 {recipe.difficulty}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs leading-relaxed">
                      {(() => {
                        const meta = getDifficultyMeta(recipe.difficulty);
                        if (!meta) return recipe.difficulty;
                        return (
                          <div className="space-y-1">
                            <div className="font-semibold">{meta.label}</div>
                            <p className="text-muted-foreground">{meta.description}</p>
                            <p className="text-amber-600">주의: {meta.warning}</p>
                            <p className="text-emerald-700">추천 대상: {meta.recommend}</p>
                          </div>
                        );
                      })()}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              {timeLabel ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200/80 bg-emerald-50 text-emerald-800"
                >
                  소요 {timeLabel}
                </Badge>
              ) : null}
              {recipe.servings ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-emerald-200/80 bg-emerald-50 text-emerald-800"
                >
                  {recipe.servings}인분
                </Badge>
              ) : null}
            </div>
            <ol className="space-y-3">
              {steps.map((step, idx) => (
                <li
                  key={idx}
                  className="rounded-2xl border border-emerald-100/80 bg-emerald-50/40 px-4 py-3 text-sm leading-relaxed text-emerald-950"
                >
                  <div className="mb-1 text-xs font-semibold text-emerald-700">Step {idx + 1}</div>
                  <p className="whitespace-pre-line">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* 공유 버튼 */}
      <div className="flex justify-center items-start gap-4">
        <div className="flex flex-col items-center gap-1">
          <KakaoShareButton
            contentinfo={{ title: recipe.title, description: recipe.summary }}
            imageUrl={shareImageUrl}
            url={currentUrl}
            label="카카오톡으로 공유"
            className="inline-flex cursor-pointer border-0 bg-transparent p-0 shadow-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <span className="text-xs text-slate-600">카카오톡으로 공유</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <CopyClipButton currentUrl={currentUrl} />
          <span className="text-xs text-slate-600">URL 공유</span>
        </div>
      </div>
    </article>
  );
}
