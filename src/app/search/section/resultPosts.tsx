import { Eye, MessageCircle, SearchX } from "lucide-react";
import Link from "next/link";

import Section from "@/components/status/Section";
import type { Post, PostListResult } from "@/domain/post/types";
import { PaginationComponent } from "@/lib/pagenation/pagenation";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

type Props = {
  posts: PostListResult;
  searchParams: Record<string, string | string[] | undefined>;
  queryText: string;
  viewMode: ViewMode;
  error?: boolean;
  /** 이 섹션의 postPage가 결과 범위를 벗어났다. */
  outOfRange?: boolean;
};

function formatCount(value: number | null | undefined): string {
  return new Intl.NumberFormat("ko-KR").format(value ?? 0);
}

function formatTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "날짜 없음";

  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "방금 전";
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}

function buildMoreHref(queryText: string): string {
  const params = new URLSearchParams();
  if (queryText) {
    params.set("search", queryText);
    params.set("searchField", "title_contents");
  }
  const query = params.toString();
  return query ? `/posts?${query}` : "/posts";
}

function PostResultCard({ post, viewMode }: { post: Post; viewMode: ViewMode }) {
  return (
    <article
      className={cn(
        "rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md",
        viewMode === "list" && "p-5"
      )}
    >
      <Link href={`/posts/${post.id}`} prefetch={false} className="block min-w-0">
        <h3 className="line-clamp-1 text-base font-black tracking-tight text-zinc-950">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-[40px] text-sm font-medium leading-5 text-zinc-500">
          {post.contentText || "내용 미리보기가 없습니다."}
        </p>
      </Link>

      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-zinc-500">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-100 text-[11px] font-black text-emerald-700">
          {post.writerName.slice(0, 1).toUpperCase() || "U"}
        </span>
        <Link
          href={post.writerUid ? `/profile/${post.writerUid}` : "/posts"}
          prefetch={false}
          className="min-w-0 truncate transition hover:text-[#34783f]"
        >
          {post.writerName}
        </Link>
        <span className="shrink-0">{formatTime(post.createdAt)}</span>
      </div>

      <div className="mt-4 flex items-center gap-5 text-xs font-medium text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <MessageCircle className="h-4 w-4" />
          {formatCount(post.commentCount)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {formatCount(post.viewCount)}
        </span>
      </div>
    </article>
  );
}

export default function SearchResultPosts({
  posts,
  searchParams,
  queryText,
  viewMode,
  error = false,
  outOfRange = false,
}: Props) {
  const postItems = posts.items;
  const currentPage = Number(searchParams.postPage) || 1;
  const gridClass =
    viewMode === "list"
      ? "grid grid-cols-1 gap-4"
      : "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4";

  return (
    <section>
      <header className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-blue-50 text-blue-500">
            <MessageCircle className="h-4 w-4" />
          </span>
          <h2 className="text-xl font-black tracking-tight text-zinc-950">커뮤니티</h2>
          <span className="text-base font-black text-[#34783f]">{formatCount(posts.total)}</span>
        </div>
        <Link
          href={buildMoreHref(queryText)}
          prefetch={false}
          className="text-sm font-bold text-zinc-500 transition hover:text-[#34783f]"
        >
          더보기
        </Link>
      </header>

      <Section
        name="search.posts"
        failed={error}
        outOfRange={outOfRange}
        pageParam="postPage"
        title="게시글 검색 결과를 표시하지 못했습니다."
        resetKeys={[queryText, currentPage, viewMode, String(searchParams.sort ?? "")]}
      >
        {postItems.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 text-center">
            <SearchX className="h-7 w-7 text-zinc-300" />
            <p className="mt-3 text-sm font-bold text-zinc-700">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className={gridClass}>
            {postItems.map((post) => (
              <PostResultCard key={post.id} post={post} viewMode={viewMode} />
            ))}
          </div>
        )}

        {posts.total > 0 ? (
          <div className="mt-5">
            <PaginationComponent
              basePath="/search"
              page={currentPage}
              pageItemSize={posts.limit}
              blockSize={5}
              total={posts.total}
              query={searchParams}
              pageParam="postPage"
              scroll={false}
            />
          </div>
        ) : null}
      </Section>
    </section>
  );
}
