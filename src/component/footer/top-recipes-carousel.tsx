"use client";

import { Button } from "@/components/ui/button";
import { TopRecipe } from "@/domain/user_like/types";
import { Eye, Heart } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

type TopRecipesCarouselProps = {
  label: string;
  recipes: TopRecipe[];
};

export default function TopRecipesCarousel({ label, recipes }: TopRecipesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const rankBadges = [
    { bg: "bg-[#f7c948]", text: "text-[#6b4000]", label: "1위" }, // 금
    { bg: "bg-[#e5e7eb]", text: "text-[#1f2937]", label: "2위" }, // 은
    { bg: "bg-[#d97757]", text: "text-[#fff7ed]", label: "3위" }, // 동
  ];

  const scroll = (direction: "prev" | "next") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const amount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div className="mb-2 text-xs text-muted-foreground">{label} TOP 10</div>
      <div className="relative pr-10 pl-10">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {recipes.map((recipe, index) => (
            <article
              key={recipe.recipeId}
              className="relative flex min-w-[220px] max-w-[240px] flex-shrink-0 flex-col overflow-hidden rounded-xl bg-card shadow-sm"
            >
              {rankBadges[index] ? (
                <div
                  className={`absolute left-2 top-2 z-10 rounded-full border border-white/80 px-2.5 py-1 text-[11px] font-semibold shadow-md ${rankBadges[index].bg} ${rankBadges[index].text}`}
                >
                  {rankBadges[index].label}
                </div>
              ) : (
                <div className="absolute left-2 top-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
                  #{index + 1}
                </div>
              )}
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
                {recipe.image ? (
                  <Image
                    fill
                    className="z-0 object-cover"
                    src={recipe.image}
                    alt={recipe.summary || "레시피"}
                    sizes="240px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-emerald-700">
                    이미지 없음
                  </div>
                )}
              </div>
              <div className="space-y-1 px-3 py-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {recipe.title}
                </h3>
                <p className="line-clamp-2 text-[11px] text-muted-foreground">{recipe.summary}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-500" />
                    {recipe.likeCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {recipe.viewCount}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="pointer-events-auto h-7 w-7 -translate-x-1 rounded-full border border-emerald-200 bg-emerald-50/90 text-emerald-800 shadow-sm hover:bg-white"
            onClick={() => scroll("prev")}
          >
            {"<"}
          </Button>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="pointer-events-auto h-7 w-7 translate-x-1 rounded-full border border-emerald-200 bg-emerald-50/90 text-emerald-800 shadow-sm hover:bg-white"
            onClick={() => scroll("next")}
          >
            {">"}
          </Button>
        </div>
      </div>
    </div>
  );
}
