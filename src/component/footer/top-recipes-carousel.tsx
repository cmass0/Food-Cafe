"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TopCombo } from "@/domain/combo/combo_like/types";
import { TopRecipe } from "@/domain/recipe/recipe_like/types";
import { Eye, Heart } from "lucide-react";
import Image from "next/image";

type TopRecipesCarouselProps = {
  label: string;
  contents: TopRecipe[] | TopCombo[];
};

export default function TopCarousel({ label, contents }: TopRecipesCarouselProps) {
  const rankBadges = [
    { bg: "bg-[#f7c948]", text: "text-[#6b4000]", label: "1위" }, // 금
    { bg: "bg-[#e5e7eb]", text: "text-[#1f2937]", label: "2위" }, // 은
    { bg: "bg-[#d97757]", text: "text-[#fff7ed]", label: "3위" }, // 동
  ];
  const existContents = contents && contents.length > 0;
  return (
    <>
      {existContents ? (
        <div className="relative ">
          <div className="mb-2 text-xs text-muted-foreground ">{label} TOP 10</div>
          <Carousel opts={{ align: "start", dragFree: true }} className="relative pr-10 pl-10 ">
            <CarouselContent className="pb-2">
              {contents.map((content, index) => (
                <CarouselItem
                  key={content.id}
                  className="min-w-[220px] max-w-[240px] basis-[220px]"
                >
                  <article className="relative flex flex-col overflow-hidden rounded-xl bg-card shadow-sm">
                    {rankBadges[index] ? (
                      <div
                        className={`absolute left-2 top-2 z-10 rounded-full border border-white/80 px-2.5 py-1 text-[11px] font-semibold shadow-md ${rankBadges[index].bg} ${rankBadges[index].text}`}
                      >
                        {rankBadges[index].label}
                      </div>
                    ) : (
                      <div className="absolute left-2 top-2 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {index + 1}위
                      </div>
                    )}
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-gradient-to-br from-emerald-50 to-emerald-100">
                      {content.image ? (
                        <Image
                          fill
                          className="z-0 object-cover"
                          src={content.image}
                          alt={content.summary || "레시피"}
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
                        {content.title}
                      </h3>
                      <p className="line-clamp-2 text-[11px] text-muted-foreground">
                        {content.summary}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3 text-rose-500" />
                          {content.likeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {content.viewCount}
                        </span>
                      </div>
                    </div>
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious
              variant="secondary"
              className="left-0 h-7 w-7 -translate-x-1 border border-emerald-200 bg-emerald-50/90 text-emerald-800 shadow-sm hover:bg-white"
            />
            <CarouselNext
              variant="secondary"
              className="right-0 h-7 w-7 translate-x-1 border border-emerald-200 bg-emerald-50/90 text-emerald-800 shadow-sm hover:bg-white"
            />
          </Carousel>
        </div>
      ) : (
        <div className="flex justify-center items-center text-sm py-10 font-bold text-muted-foreground">
        {label} 정보가 없습니다.
        </div>
      )}
    </>
  );
}
