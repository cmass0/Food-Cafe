"use client";
import { Heart, Eye, MessageCircle } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

type TopRecipesCarouselProps = {
  label: string;
};

const PLACEHOLDER_RECIPES = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  title: `플레이스홀더 레시피 ${index + 1}`,
  description: "나중에 실제 인기 레시피 데이터가 들어갑니다.",
  likes: 120 - index * 5,
  views: 980 - index * 13,
  comments: 40 - index * 2,
}));

export default function TopRecipesCarousel({ label }: TopRecipesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function scroll(direction: "prev" | "next") {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const amount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      <div className="mb-2 text-xs text-muted-foreground">{label} TOP 10</div>
      <div className="relative pr-10 pl-10">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {PLACEHOLDER_RECIPES.map((recipe, index) => (
            <article
              key={recipe.id}
              className="relative flex min-w-[220px] max-w-[240px] flex-shrink-0 flex-col overflow-hidden rounded-xl bg-card shadow-sm"
            >
              {index === 0 ? (
                <div className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-emerald-50 shadow">
                  1위
                </div>
              ) : (
                <div className="absolute left-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
                  #{index + 1}
                </div>
              )}
              <div className="aspect-[4/3] w-full bg-gradient-to-br from-emerald-50 to-emerald-100" />
              <div className="space-y-1 px-3 py-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {recipe.title}
                </h3>
                <p className="line-clamp-2 text-[11px] text-muted-foreground">
                  {recipe.description}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Heart className="h-3 w-3 text-rose-500" />
                    {recipe.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {recipe.views}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {recipe.comments}
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
