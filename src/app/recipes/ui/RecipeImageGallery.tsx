"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { capImageDensity } from "@/lib/image-sizes";
import { cn } from "@/lib/utils";

type RecipeImageGalleryProps = {
  images: string[];
  title: string;
};

// 큰 사진 아래에 나머지 사진을 가로 캐러셀로 둔다. 작은 사진을 누르면 큰 사진이 그 사진으로 바뀐다.
export default function RecipeImageGallery({ images, title }: RecipeImageGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mainImage = images[selected] ?? images[0] ?? null;

  // 넘길 사진이 남아 있을 때만 ‹ › 버튼을 누를 수 있게 한다.
  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollPrev(track.scrollLeft > 1);
    setCanScrollNext(track.scrollLeft + track.clientWidth < track.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [updateScrollState, images.length]);

  // 고른 사진이 줄 밖으로 반쯤 걸쳐 있으면 줄만 가로로 당긴다. scrollIntoView는 페이지까지 세로로 움직인다.
  function select(index: number) {
    setSelected(index);
    const track = trackRef.current;
    const thumb = thumbRefs.current[index];
    if (!track || !thumb) return;
    const left = thumb.offsetLeft - track.offsetLeft;
    const right = left + thumb.offsetWidth;
    if (left < track.scrollLeft) {
      track.scrollTo({ left, behavior: "smooth" });
    } else if (right > track.scrollLeft + track.clientWidth) {
      track.scrollTo({ left: right - track.clientWidth, behavior: "smooth" });
    }
  }

  function scrollTrack(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-[4/2.7] overflow-hidden rounded-lg bg-emerald-50">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={images.length > 1 ? `${title} 사진 ${selected + 1}` : title}
            fill
            className="object-cover"
            sizes={capImageDensity("(max-width: 1024px) 100vw, 560px")}
            preload={selected === 0}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-emerald-700">
            이미지가 없습니다.
          </div>
        )}

        {images.length > 1 ? (
          <span className="absolute right-4 top-4 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white tabular-nums backdrop-blur">
            {selected + 1} / {images.length}
          </span>
        ) : null}
      </div>

      {images.length > 1 ? (
        <div className="relative">
          <div
            ref={trackRef}
            onScroll={updateScrollState}
            // 선택 테두리가 스크롤 영역에 잘리지 않도록 안쪽 여백을 둔다.
            className="flex snap-x snap-mandatory scroll-px-1 gap-3 overflow-x-auto scroll-smooth p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                ref={(element) => {
                  thumbRefs.current[index] = element;
                }}
                type="button"
                onClick={() => select(index)}
                aria-label={`${index + 1}번째 사진 보기`}
                aria-current={index === selected ? "true" : undefined}
                className={cn(
                  // 모바일은 3장, 넓은 화면은 4장이 한 화면에 보인다.
                  "relative aspect-[4/3] w-[calc((100%-1.5rem)/3)] shrink-0 snap-start overflow-hidden rounded-md bg-emerald-50 transition sm:w-[calc((100%-2.25rem)/4)]",
                  index === selected
                    ? "ring-2 ring-[#34783f] ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes={capImageDensity("(max-width: 640px) 33vw, 160px")}
                  className="object-cover"
                />
                {index === 0 ? (
                  <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-zinc-700">
                    대표
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {canScrollPrev ? (
            <button
              type="button"
              onClick={() => scrollTrack(-1)}
              aria-label="이전 사진들"
              className="absolute left-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-zinc-700 shadow-md transition hover:text-zinc-950"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : null}
          {canScrollNext ? (
            <button
              type="button"
              onClick={() => scrollTrack(1)}
              aria-label="다음 사진들"
              className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-zinc-700 shadow-md transition hover:text-zinc-950"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
