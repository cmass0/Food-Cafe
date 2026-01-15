"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { Combos } from "@/domain/combo/types";
import { Bookmark, Eye, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type ComboPreviewCardProps = {
  combo: Combos | null;
};

export default function ComboPreviewCard({ combo }: ComboPreviewCardProps) {
  const activeItems = combo?.items ?? [];
  const createdLabel = combo?.createdAt
    ? combo.createdAt.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })
    : "";

  return (
    <section className="w-full lg:w-1/3">
      <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-muted-foreground/20 bg-background shadow-sm">
        <div className="border-b border-muted-foreground/20 p-4">
          <h2 className="line-clamp-1 text-lg font-semibold">
            {combo?.title ?? "조합을 선택해 주세요"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {combo
              ? `${combo.writerName ?? ""} · ${createdLabel}`
              : "왼쪽 카드에서 조합을 선택하면 상세 정보가 보여요."}
          </p>
        </div>

        <div className="relative h-52 w-full overflow-hidden bg-muted/30">
          {combo?.image ? (
            <Image
              src={combo.image}
              alt={combo.title || "조합 미리보기 이미지"}
              fill
              sizes="(max-width: 1280px) 100vw, 40vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              이미지 없음
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <p className="line-clamp-4 text-sm text-muted-foreground">
            {combo?.summary || "요약 정보가 없습니다."}
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <span>난이도 {combo?.difficulty ?? "미정"}</span>
            <span>총시간 {combo?.timeMinutes ? `${combo.timeMinutes}분` : "미정"}</span>
            <span className="flex items-center gap-1.5">
              <Heart className="h-3 w-3 fill-red-400 text-red-400" />
              {combo?.likeCount ?? 0}
            </span>
            <span className="flex items-center gap-1.5">
              <Bookmark className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {combo?.bookmarkCount ?? 0}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-black" /> {combo?.viewCount ?? 0}
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">태그</p>
            <div className="flex max-h-16 flex-wrap gap-2 overflow-y-auto">
              {combo?.tags?.length ? (
                combo.tags.slice(0, 6).map((tag) => (
                  <Badge
                    key={tag}
                    title={tag}
                    className="max-w-full truncate border border-emerald-400/30 bg-emerald-500/10 text-black hover:text-white"
                  >
                    {tag}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">태그 없음</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">구성 아이템</p>
            <div className="text-xs text-muted-foreground">
              <Carousel className="w-full" opts={{ align: "start", containScroll: "trimSnaps" }}>
                <CarouselContent className="-ml-2">
                  {activeItems.length ? (
                    activeItems.map((item, index) => {
                      const title =
                        item.type === "recipe"
                          ? item.title || "레시피명 없음"
                          : item.productName || "제품명 없음";
                      const image = item.image ?? null;
                      return (
                        <CarouselItem
                          key={`${item.type}-${index}`}
                          className="basis-[110px] pl-2 sm:basis-[120px]"
                        >
                          <Card className="overflow-hidden border border-muted-foreground/20">
                            <div className="relative h-16 w-full">
                              {image ? (
                                <Image src={image} fill alt={title} className="object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center border-b-1 text-[10px] text-muted-foreground">
                                  이미지 없음
                                </div>
                              )}
                            </div>
                            <div className="line-clamp-1 flex items-center justify-center px-2 py-1 text-[11px] text-muted-foreground">
                              {title}
                            </div>
                          </Card>
                        </CarouselItem>
                      );
                    })
                  ) : (
                    <div className="text-xs text-muted-foreground">구성 아이템이 없습니다.</div>
                  )}
                </CarouselContent>
                <CarouselPrevious className="left-2 h-7 w-7 disabled:pointer-events-none disabled:opacity-0" />
                <CarouselNext className="right-2 h-7 w-7 disabled:pointer-events-none disabled:opacity-0" />
              </Carousel>
            </div>
          </div>

          {combo ? (
            <Button asChild className="mt-auto w-full rounded-full">
              <Link href={`/combos/${combo.id}`}>상세보기</Link>
            </Button>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
