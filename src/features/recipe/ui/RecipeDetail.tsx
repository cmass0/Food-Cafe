import Image from "next/image";
import type { Recipe } from "../types";
import ViewCount from "@/features/view/ui/ViewCount.client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const tags = recipe.tags?.filter((tag) => typeof tag === "string" && tag.length > 0) ?? [];
  const chips = recipe.category ? [recipe.category, ...tags] : tags;

  // 단순 텍스트 분리로 스텝 리스트를 생성 (HTML 태그 제거 후 줄바꿈 기준)
  let steps: string[] = [];
  if (recipe.recipe) {
    const plain = recipe.recipe.replace(/<[^>]+>/g, "\n");
    steps = plain
      .split(/\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs font-medium text-emerald-700">
            {chips.map((chip, idx) => (
              <span key={`${chip}-${idx}`} className="bg-emerald-50 px-3 py-1">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{recipe.title}</h1>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>작성자 {recipe.writerName ?? "익명"}</span>
          <span aria-hidden="true">·</span>
          <span>{recipe.createdAt.toLocaleString("ko-KR")}</span>
          <span aria-hidden="true">·</span>
          <span>
            조회수 <ViewCount type="recipe" id={recipe.id} initialCount={recipe.viewCount ?? 0} />
          </span>
        </div>
      </header>

      <div className="space-y-6">
        {recipe.image ? (
          <section className="relative aspect-[16/9] w-full overflow-hidden border border-border/70 bg-slate-50 shadow-sm">
            <Image
              src={recipe.image}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
          </section>
        ) : null}
        <div className="flex justify-center">
          {recipe.summary ? (
            <p className=" text-base leading-relaxed text-foreground/80">{recipe.summary}</p>
          ) : null}
        </div>
        {steps.length > 0 ? (
          <section className="border border-border/70 bg-white px-6 py-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">조리 단계</h2>
            <div className="mb-4 flex flex-wrap gap-3 text-xs text-slate-600">
              {recipe.difficulty ? (
                <span className="border border-border/70 bg-slate-50 px-3 py-1">
                  난이도: {recipe.difficulty}
                </span>
              ) : null}
              {recipe.timeMinutes ? (
                <span className="border border-border/70 bg-slate-50 px-3 py-1">
                  소요시간: {recipe.timeMinutes}분
                </span>
              ) : null}
              {recipe.servings ? (
                <span className="border border-border/70 bg-slate-50 px-3 py-1">
                  인분: {recipe.servings}인분
                </span>
              ) : null}
            </div>
            <ol className="space-y-3">
              {steps.map((step, idx) => (
                <li
                  key={idx}
                  className="border border-border/60 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-800"
                >
                  <div className="mb-1 text-xs font-semibold text-slate-500">Step {idx + 1}</div>
                  <p className="whitespace-pre-line">{step}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : recipe.recipe ? (
          <section className="border border-border/70 bg-white px-6 py-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">조리 단계</h2>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: recipe.recipe }} />
          </section>
        ) : null}
      </div>
    </article>
  );
}
