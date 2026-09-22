"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { RecommendResultCard } from "./RecommendResultCard";
import type { RecommendResultCarouselProps } from "./types";

export function RecommendResultCarousel({ items }: RecommendResultCarouselProps) {
  const [viewportRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateNavigation = useCallback(() => {
    if (!emblaApi) return;

    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    updateNavigation();
    emblaApi.on("select", updateNavigation);
    emblaApi.on("reInit", updateNavigation);

    return () => {
      emblaApi.off("select", updateNavigation);
      emblaApi.off("reInit", updateNavigation);
    };
  }, [emblaApi, updateNavigation]);

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">조건에 맞는 메뉴를 찾지 못했어요.</p>;
  }

  return (
    <section className="min-w-0" aria-label="추천 메뉴">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-zinc-500">FoodCafe 추천 결과</p>
        {items.length > 1 ? (
          <div className="flex gap-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={!canScrollPrev}
              onClick={() => emblaApi?.scrollPrev()}
              aria-label="이전 추천"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              disabled={!canScrollNext}
              onClick={() => emblaApi?.scrollNext()}
              aria-label="다음 추천"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <div ref={viewportRef} className="overflow-hidden">
        <div className="-ml-3 flex touch-pan-y">
          {items.map((item) => (
            <div
              key={`${item.sourceType}-${item.id}`}
              className="min-w-0 flex-[0_0_82%] pl-3 sm:flex-[0_0_48%]"
            >
              <RecommendResultCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
