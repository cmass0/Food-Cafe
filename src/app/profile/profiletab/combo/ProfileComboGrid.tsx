import { ChefHat, Clock3, Eye, Heart, MoreVertical } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Combos } from "@/domain/combo/types";
import { capImageDensity } from "@/lib/image-sizes";
import { cn } from "@/lib/utils";
import type { ProfileView } from "../../profile-types";

type Props = {
  combos: Combos[];
  view?: ProfileView;
};

function visibleTags(combo: Combos) {
  const tags = Array.isArray(combo.tags)
    ? combo.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)
    : [];

  return Array.from(new Set(tags)).slice(0, 3);
}

export default function ProfileComboGrid({ combos, view = "grid" }: Props) {
  const isList = view === "list";

  if (combos.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white text-center text-sm font-semibold text-zinc-500 shadow-sm">
        <ChefHat className="mb-3 h-9 w-9 text-zinc-300" aria-hidden="true" />
        컨텐츠가 존재하지 않습니다.
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", isList ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3")}>
      {combos.map((combo) => {
        const tags = visibleTags(combo);

        return (
          <Card
            key={combo.id}
            className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent
              className={cn(
                "relative grid gap-4 p-3",
                isList
                  ? "grid-cols-[132px_minmax(0,1fr)] sm:grid-cols-[190px_minmax(0,1fr)]"
                  : "grid-cols-[128px_minmax(0,1fr)]"
              )}
            >
              <Link
                href={`/combos/${combo.id}`}
                className={cn(
                  "relative overflow-hidden rounded-lg bg-zinc-100",
                  isList ? "h-36 sm:h-40" : "h-36"
                )}
                aria-label={`${combo.title || "제목 없음"} 상세 보기`}
              >
                {combo.image ? (
                  <Image
                    src={combo.image}
                    alt={combo.title || "조합 이미지"}
                    fill
                    sizes={capImageDensity(isList ? "190px" : "150px")}
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-300">
                    <ChefHat className="h-12 w-12" aria-hidden="true" />
                  </div>
                )}
              </Link>
              <div className="min-w-0 pr-6">
                <Link
                  href={`/combos/${combo.id}`}
                  className="line-clamp-1 text-base font-bold text-zinc-950 hover:text-emerald-700"
                >
                  {combo.title || "제목 없음"}
                </Link>
                {combo.summary ? (
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-500">
                    {combo.summary}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  {combo.difficulty ? (
                    <Badge className="rounded-full border-0 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-emerald-50">
                      {combo.difficulty}
                    </Badge>
                  ) : null}
                  {combo.timeMinutes ? (
                    <Badge className="rounded-full border-0 bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100">
                      <Clock3 className="mr-1 h-3 w-3" aria-hidden="true" />
                      {combo.timeMinutes}분
                    </Badge>
                  ) : null}
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="rounded-full border-0 bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-5 flex items-center gap-4 text-sm text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-4 w-4 fill-pink-400 text-pink-400" aria-hidden="true" />
                    <span>{combo.likeCount ?? 0}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4 text-zinc-700" aria-hidden="true" />
                    <span>{combo.viewCount ?? 0}</span>
                  </span>
                </div>
              </div>
              <span
                className="absolute right-3 top-4 rounded-md p-1 text-zinc-500"
                aria-hidden="true"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
