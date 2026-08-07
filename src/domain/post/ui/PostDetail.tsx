import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AuthorProfileMenu from "@/components/user/AuthorProfileMenu";
import ViewCount from "@/domain/view/ui/ViewCount.client";
import { getPostCategoryLabel } from "@/domain/post/category";
import PostLikeButton from "@/domain/post/post_like/ui/PostLikeButton";
import { renderPostContentHtml } from "./PostContentHtml";
import PostHeaderActions from "./PostHeaderActions.client";
import type { Post } from "../types";

function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function initials(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

export default function PostDetail({ post }: { post: Post }) {
  const contentHtml = post.contentHtml ? renderPostContentHtml(post.contentHtml) : null;
  const boardLabel = getPostCategoryLabel(post.category);

  return (
    <article>
      <header className="border-b border-border/80 pb-6">
        <nav
          aria-label="경로"
          className="flex items-center gap-2 text-sm font-medium text-zinc-500"
        >
          <Link href="/" className="rounded-sm p-0.5 hover:text-[#15933d]" aria-label="홈">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          <Link href="/posts" className="hover:text-[#15933d]">
            커뮤니티
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-800">{boardLabel}</span>
        </nav>

        <span className="mt-8 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#16883d]">
          {boardLabel}
        </span>
        <h1 className="mt-4 break-words text-3xl font-black tracking-tight text-zinc-950 sm:text-[2rem]">
          {post.title}
        </h1>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-zinc-500">
            <div className="inline-flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-emerald-100 text-[11px] font-bold text-[#16883d]">
                  {initials(post.writerName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-zinc-600">작성자</span>
              <AuthorProfileMenu name={post.writerName} userId={post.writerUid} />
            </div>
            <span className="hidden h-4 w-px bg-zinc-300 sm:block" />
            <span>{formatPostDate(post.createdAt)}</span>
            <span className="hidden h-4 w-px bg-zinc-300 sm:block" />
            <span>
              조회수 <ViewCount type="post" id={post.id} initialCount={post.viewCount} />
            </span>
          </div>
          <PostHeaderActions postId={post.id} postTitle={post.title} />
        </div>
      </header>

      {contentHtml ? (
        <section
          className="prose prose-zinc max-w-none py-9 text-[15px] leading-8"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      ) : (
        <section className="py-9 text-sm text-muted-foreground">등록된 본문이 없습니다.</section>
      )}

      <div className="border-t border-border/80 py-5">
        <PostLikeButton postId={post.id} initialCount={post.likeCount} />
      </div>
    </article>
  );
}
