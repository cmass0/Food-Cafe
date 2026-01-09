import { Eye, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Combos } from "@/domain/combo/types";

type Props = {
  combos: Combos[];
  emptyMessage: string;
};

export default function ProfileComboGrid({ combos, emptyMessage }: Props) {
  if (combos.length === 0) {
    return <div className="text-sm text-slate-600">{emptyMessage}</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {combos.map((combo) => {
        const tags = Array.isArray(combo.tags)
          ? combo.tags.filter((tag) => typeof tag === "string" && tag.length > 0)
          : [];

        return (
          <Card
            key={combo.id}
            className="overflow-hidden border border-border/70 bg-white shadow-sm transition hover:shadow-md"
          >
            <CardContent className="flex gap-4 p-4">
              <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-md bg-slate-100">
                {combo.image ? (
                  <Image
                    src={combo.image}
                    alt={combo.title || "조합 이미지"}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                    IMG
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Link
                  href={`/combos/${combo.id}`}
                  className="block text-base font-semibold text-slate-900"
                >
                  {combo.title || "제목 없음"}
                </Link>
                {combo.summary ? (
                  <p className="line-clamp-2 text-sm text-slate-600">{combo.summary}</p>
                ) : null}
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  {combo.difficulty ? <Badge variant="outline">{combo.difficulty}</Badge> : null}
                  {combo.timeMinutes ? (
                    <Badge variant="outline">{combo.timeMinutes}분</Badge>
                  ) : null}
                  {tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4 fill-pink-300/100 text-emerald-50" />
                    <span>{combo.likeCount ?? 0}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4 text-gray-950" />
                    <span>{combo.viewCount ?? 0}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
