"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { TrendingContentItem } from "@/features/trending/types";
import { Heart, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type TopRecipesCarouselProps = {
  label: string;
  contents: TrendingContentItem[];
  maxCount?: number;
};

export default function TopCarousel({ label, contents, maxCount }: TopRecipesCarouselProps) {
  const rankBadges = [
    { bg: "bg-[#f7c948]", text: "text-[#6b4000]", label: "1위" }, // 금
    { bg: "bg-[#e5e7eb]", text: "text-[#1f2937]", label: "2위" }, // 은
    { bg: "bg-[#d97757]", text: "text-[#fff7ed]", label: "3위" }, // 동
  ];
  const existContents = contents && contents.length > 0;
  const countLabel = typeof maxCount === "number" ? `TOP ${maxCount}` : "TOP 10";
  return (
    <>
      {existContents ? (
        <div className="relative overflow-x-hidden">
          <div className="mb-2 text-xs text-muted-foreground ">
            {label} {countLabel}
          </div>
          <Carousel
            opts={{ align: "start", dragFree: true, containScroll: "trimSnaps" }}
            className="relative w-full min-w-0 px-2 sm:px-4 md:px-6"
          >
            <CarouselContent className="pb-2">
              {contents.map((content, index) => (
                <CarouselItem
                  key={content.id}
                  className="basis-[80%] sm:basis-[60%] md:basis-[45%] lg:basis-[30%] xl:basis-[220px]"
                >
                  <Link
                    href={`/${content.resourceType === "recipe" ? "recipes" : content.resourceType === "combo" ? "combos" : "posts"}/${content.id}`}
                    className="relative flex flex-col overflow-hidden rounded-xl bg-card shadow-sm"
                  >
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
                          alt={content.title}
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
                          {content.recentLikeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {content.recentParticipantCount}
                        </span>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>

            <CarouselPrevious
              variant="secondary"
              className="left-2 top-1/2 h-7 w-7 -translate-y-1/2 border border-emerald-200 bg-emerald-50/90 text-emerald-800 shadow-sm hover:bg-white"
            />
            <CarouselNext
              variant="secondary"
              className="right-2 top-1/2 h-7 w-7 -translate-y-1/2 border border-emerald-200 bg-emerald-50/90 text-emerald-800 shadow-sm hover:bg-white"
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
