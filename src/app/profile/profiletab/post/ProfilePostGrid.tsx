import { Bookmark, Eye, Heart, MessageCircle, MessagesSquare } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPostCategoryOption } from "@/domain/post/category";
import type { Post } from "@/domain/post/types";
import { cn } from "@/lib/utils";
import type { ProfileView } from "../../profile-types";

type Props = {
  posts: Post[];
  view?: ProfileView;
};

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function summary(post: Post): string {
  const text = post.contentText?.replace(/\s+/g, " ").trim();
  if (!text) return "본문 미리보기가 없습니다.";
  return text;
}

export default function ProfilePostGrid({ posts, view = "grid" }: Props) {
  const isList = view === "list";

  if (posts.length === 0) {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white text-center text-sm font-semibold text-zinc-500 shadow-sm">
        <MessagesSquare className="mb-3 h-9 w-9 text-zinc-300" aria-hidden="true" />
        조건에 맞는 게시글이 없습니다.
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", isList ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-3")}>
      {posts.map((post) => {
        const category = getPostCategoryOption(post.category);

        return (
          <Card
            key={post.id}
            className="group rounded-lg border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardContent className={cn("p-5", isList && "sm:flex sm:items-center sm:gap-6")}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <Badge className={cn("rounded-full border-0 px-3 py-1 text-[11px] font-bold", category.className)}>
                    {category.shortLabel}
                  </Badge>
                  <time className="shrink-0 text-xs text-zinc-400" dateTime={post.createdAt.toISOString()}>
                    {formatDate(post.createdAt)}
                  </time>
                </div>
                <Link
                  href={`/posts/${post.id}`}
                  className="mt-4 block line-clamp-1 text-base font-bold text-zinc-950 transition hover:text-emerald-700"
                >
                  {post.title}
                </Link>
                <p className={cn("mt-3 text-sm leading-6 text-zinc-500", isList ? "line-clamp-1" : "line-clamp-2 min-h-12")}>
                  {summary(post)}
                </p>
              </div>
              <div className={cn("mt-5 flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-500", isList && "sm:mt-0 sm:w-[260px] sm:justify-end")}>
                <span className="flex items-center gap-1.5" title="좋아요">
                  <Heart className="h-4 w-4 text-pink-500" aria-hidden="true" />
                  {post.likeCount}
                </span>
                <span className="flex items-center gap-1.5" title="북마크">
                  <Bookmark className="h-4 w-4 text-amber-500" aria-hidden="true" />
                  {post.bookmarkCount}
                </span>
                <span className="flex items-center gap-1.5" title="댓글">
                  <MessageCircle className="h-4 w-4 text-sky-500" aria-hidden="true" />
                  {post.commentCount}
                </span>
                <span className="flex items-center gap-1.5" title="조회수">
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  {post.viewCount}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
