import { Card } from "@/components/ui/card";
import type { TrendingContentItem } from "@/features/trending/types";
import { Bookmark, Eye, Heart, MessageCircle, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type RankingGridProps = {
  items: TrendingContentItem[];
};

const rankBadges = [
  { bg: "bg-amber-300", text: "text-amber-900", label: "1st" },
  { bg: "bg-slate-200", text: "text-slate-800", label: "2nd" },
  { bg: "bg-orange-300", text: "text-orange-950", label: "3rd" },
];

export default function RankingGrid({ items }: RankingGridProps) {
  if (!items.length) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        결과가 존재하지 않습니다.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {items.map((item, index) => {
        const badge = rankBadges[index];
        const detailPath =
          item.resourceType === "recipe"
            ? "recipes"
            : item.resourceType === "combo"
              ? "combos"
              : "posts";
        const detailHref = `/${detailPath}/${item.id}`;
        const profileHref = item.writerUid ? `/profile/${item.writerUid}` : null;

        return (
          <Card
            key={item.id}
            className="group overflow-hidden border-muted/40 bg-card/80 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <Link href={detailHref} className="block">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted/30">
                {item.image ? (
                  <Image
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    src={item.image}
                    alt={item.title}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
                {badge ? (
                  <div
                    className={`absolute left-3 top-3 rounded-full px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </div>
                ) : (
                  <div className="absolute left-3 top-3 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                    #{index + 1}
                  </div>
                )}
              </div>
            </Link>
            <div className="flex flex-col gap-1 px-4 py-3 text-left">
              <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{item.title}</h3>
              {profileHref ? (
                <Link
                  href={profileHref}
                  className="text-xs text-muted-foreground transition hover:text-foreground"
                >
                  {item.writerName ?? "Unknown"}
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground">{item.writerName ?? "Unknown"}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3 w-3 text-rose-500" /> {item.recentLikeCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bookmark className="h-3 w-3 text-amber-500" /> {item.recentBookmarkCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 text-sky-500" /> {item.recentCommentCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3 text-emerald-600" /> {item.recentParticipantCount}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground/80">
                <span>누적 좋아요 {item.likeCount}</span>
                <span className="inline-flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {item.viewCount}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
