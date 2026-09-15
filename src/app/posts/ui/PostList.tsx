"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getPostCategoryOption } from "@/domain/post/category";
import { cn } from "@/lib/utils";
import type { Post } from "@/domain/post/types";

type PostListProps = {
  posts: Post[];
  className?: string;
  variant?: "default" | "board" | "community";
  detailListContext?: {
    listPage: number;
    listLimit: number;
  };
  activePostId?: string;
};

function formatDate(date: Date) {
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return sameYear ? `${month}-${day}` : `${year}-${month}-${day}`;
}

function initials(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

function buildPostHref(
  postId: string,
  detailListContext: PostListProps["detailListContext"]
): string {
  if (!detailListContext) return `/posts/${postId}`;

  const searchParams = new URLSearchParams({
    listPage: String(detailListContext.listPage),
    listLimit: String(detailListContext.listLimit),
  });
  return `/posts/${postId}?${searchParams.toString()}`;
}

export default function PostList({
  posts,
  className,
  variant = "default",
  detailListContext,
  activePostId,
}: PostListProps) {
  const isBoardList = variant === "board";
  const isCommunityList = variant === "community";
  const isPlainTable = isBoardList || isCommunityList;

  if (posts.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-16 text-center text-sm font-medium text-zinc-500",
          className
        )}
      >
        조건에 맞는 게시글이 없습니다.
      </div>
    );
  }

  return (
    <div
      className={cn(
        isBoardList
          ? "overflow-hidden bg-white"
          : isCommunityList
            ? "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
          : "overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full border-collapse text-sm",
            isCommunityList
              ? "table-fixed lg:min-w-[860px] lg:table-auto"
              : "min-w-[880px]"
          )}
        >
          <thead
            className={cn(
              isCommunityList
                ? "bg-white text-zinc-700"
                : isPlainTable
                  ? "bg-white text-zinc-800"
                  : "bg-emerald-50/70 text-zinc-700"
            )}
          >
            <tr className="h-12 border-b border-zinc-200">
              <th
                className={cn(
                  "text-center font-semibold",
                  isCommunityList
                    ? "w-14 px-2 sm:w-16 sm:px-3 lg:w-[76px] lg:px-5"
                    : "w-[110px] px-5"
                )}
              >
                번호
              </th>
              <th
                className={cn(
                  "text-left font-semibold",
                  isCommunityList ? "px-3 sm:px-4 lg:px-5" : "px-5"
                )}
              >
                제목
              </th>
              <th
                className={cn(
                  "px-5 text-center font-semibold",
                  isCommunityList ? "hidden w-[120px] lg:table-cell" : "w-[180px]"
                )}
              >
                작성자
              </th>
              {isCommunityList ? (
                <th className="hidden w-[116px] px-4 text-center font-semibold lg:table-cell">
                  카테고리
                </th>
              ) : null}
              <th
                className={cn(
                  "px-5 text-center font-semibold",
                  isCommunityList ? "hidden w-[112px] lg:table-cell" : "w-[140px]"
                )}
              >
                작성일
              </th>
              <th
                className={cn(
                  "text-center font-semibold",
                  isCommunityList
                    ? "w-16 px-2 sm:w-[72px] sm:px-3 lg:w-[84px] lg:px-5"
                    : "w-[120px] px-5"
                )}
              >
                조회수
              </th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, index) => {
              const rowNumber = post.number ?? index + 1;
              const category = getPostCategoryOption(post.category);
              const isActivePost = activePostId === post.id;
              const writerName = post.writerName || "익명";
              const writerContent = (
                <>
                  <Avatar className="h-7 w-7 opacity-80">
                    <AvatarFallback className="border border-zinc-200 bg-zinc-100 text-[11px] font-semibold text-zinc-500">
                      {initials(writerName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[110px] truncate text-zinc-500">{writerName}</span>
                </>
              );

              return (
                <tr
                  key={post.id}
                  className={cn(
                    "h-[58px] border-b border-zinc-100 transition last:border-b-0",
                    isActivePost
                      ? "border-l-4 border-l-[#15933d] bg-emerald-50/70 hover:bg-emerald-50/70"
                      : isCommunityList
                        ? "hover:bg-zinc-50"
                        : "hover:bg-emerald-50/40"
                  )}
                >
                  <td
                    className={cn(
                      "text-center font-medium text-zinc-700",
                      isCommunityList ? "px-2 sm:px-3 lg:px-5" : "px-5"
                    )}
                  >
                    {rowNumber}
                  </td>
                  <td className={isCommunityList ? "px-3 sm:px-4 lg:px-5" : "px-5"}>
                    <div className={cn("flex min-w-0 items-center", isPlainTable ? "" : "gap-7")}>
                      {!isPlainTable ? (
                        <span
                          className={cn(
                            "inline-flex min-w-[58px] justify-center rounded-full px-3 py-1 text-xs font-bold",
                            category.className
                          )}
                        >
                          {category.shortLabel}
                        </span>
                      ) : null}
                      <Link
                        href={buildPostHref(post.id, detailListContext)}
                        prefetch={false}
                        aria-current={isActivePost ? "page" : undefined}
                        className="line-clamp-1 min-w-0 font-bold text-zinc-950 transition hover:text-[#16883d]"
                      >
                        {post.title}
                      </Link>
                    </div>
                  </td>
                  <td
                    className={cn(
                      "px-5",
                      isPlainTable ? "text-center" : "text-left",
                      isCommunityList ? "hidden lg:table-cell" : ""
                    )}
                  >
                    {isPlainTable ? (
                      <span className="inline-block max-w-full truncate text-sm font-medium text-zinc-700">
                        {writerName}
                      </span>
                    ) : post.writerUid ? (
                      <Link
                        href={`/profile/${post.writerUid}`}
                        prefetch={false}
                        className="flex w-full items-center gap-2.5 text-sm font-medium text-zinc-500 transition hover:text-zinc-700"
                      >
                        {writerContent}
                      </Link>
                    ) : (
                      <div className="flex w-full items-center gap-2.5 text-sm font-medium text-zinc-500">
                        {writerContent}
                      </div>
                    )}
                  </td>
                  {isCommunityList ? (
                    <td className="hidden px-4 text-center lg:table-cell">
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2.5 py-1 text-xs font-bold",
                          category.className
                        )}
                      >
                        {category.shortLabel}
                      </span>
                    </td>
                  ) : null}
                  <td
                    className={cn(
                      "px-5 text-center font-semibold text-zinc-700",
                      isCommunityList ? "hidden lg:table-cell" : ""
                    )}
                  >
                    {formatDate(post.createdAt)}
                  </td>
                  <td className={isCommunityList ? "px-2 sm:px-3 lg:px-5" : "px-5"}>
                    {isPlainTable ? (
                      <span className="block text-center tabular-nums text-zinc-700">
                        {post.viewCount}
                      </span>
                    ) : (
                      <span className="mx-auto flex w-fit items-center gap-3 text-zinc-600">
                        <Eye className="h-4 w-4" />
                        <span>{post.viewCount}</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
