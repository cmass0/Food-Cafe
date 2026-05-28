"use client";

import { Eye } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Post } from "../types";

type PostListProps = {
  posts: Post[];
  className?: string;
};

type TypeStyle = {
  label: string;
  className: string;
};

const TYPE_STYLES: Record<string, TypeStyle> = {
  board: {
    label: "자유",
    className: "bg-emerald-50 text-[#16883d]",
  },
  free: {
    label: "자유",
    className: "bg-emerald-50 text-[#16883d]",
  },
  자유: {
    label: "자유",
    className: "bg-emerald-50 text-[#16883d]",
  },
  question: {
    label: "질문",
    className: "bg-orange-50 text-orange-500",
  },
  qna: {
    label: "질문",
    className: "bg-orange-50 text-orange-500",
  },
  질문: {
    label: "질문",
    className: "bg-orange-50 text-orange-500",
  },
  info: {
    label: "정보",
    className: "bg-blue-50 text-blue-600",
  },
  정보: {
    label: "정보",
    className: "bg-blue-50 text-blue-600",
  },
  review: {
    label: "후기",
    className: "bg-violet-50 text-violet-600",
  },
  후기: {
    label: "후기",
    className: "bg-violet-50 text-violet-600",
  },
};

const AVATAR_TONES = [
  "bg-emerald-100 text-emerald-700",
  "bg-lime-100 text-lime-700",
  "bg-sky-100 text-sky-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-violet-100 text-violet-700",
];

function formatDate(date: Date) {
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return sameYear ? `${month}-${day}` : `${year}-${month}-${day}`;
}

function formatType(type: string): TypeStyle {
  const normalized = type.trim();
  return TYPE_STYLES[normalized] ?? TYPE_STYLES[normalized.toLowerCase()] ?? {
    label: normalized || "자유",
    className: "bg-zinc-100 text-zinc-600",
  };
}

function initials(name: string) {
  const trimmed = name.trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "?";
}

function avatarTone(name: string) {
  const code = name.charCodeAt(0) || 0;
  return AVATAR_TONES[code % AVATAR_TONES.length];
}

export default function PostList({ posts, className }: PostListProps) {
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
        "overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm",
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead className="bg-emerald-50/70 text-zinc-700">
            <tr className="h-12 border-b border-zinc-200">
              <th className="w-[110px] px-5 text-center font-semibold">번호</th>
              <th className="px-5 text-center font-semibold">제목</th>
              <th className="w-[220px] px-5 text-center font-semibold">글쓴이</th>
              <th className="w-[140px] px-5 text-center font-semibold">날짜</th>
              <th className="w-[120px] px-5 text-center font-semibold">조회수</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, index) => {
              const rowNumber = post.number ?? index + 1;
              const type = formatType(post.type);
              const writerName = post.writerName || "익명";
              const writerContent = (
                <>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={cn("text-xs font-bold", avatarTone(writerName))}>
                      {initials(writerName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[110px] truncate">{writerName}</span>
                </>
              );

              return (
                <tr
                  key={post.id}
                  className="h-[58px] border-b border-zinc-200 transition hover:bg-emerald-50/40 last:border-b-0"
                >
                  <td className="px-5 text-center font-medium text-zinc-700">{rowNumber}</td>
                  <td className="px-5">
                    <div className="flex min-w-0 items-center gap-7">
                      <span
                        className={cn(
                          "inline-flex min-w-[58px] justify-center rounded-full px-3 py-1 text-xs font-bold",
                          type.className
                        )}
                      >
                        {type.label}
                      </span>
                      <Link
                        href={`/posts/${post.id}`}
                        prefetch={false}
                        className="line-clamp-1 min-w-0 font-bold text-zinc-950 transition hover:text-[#16883d]"
                      >
                        {post.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-5">
                    {post.writerUid ? (
                      <Link
                        href={`/profile/${post.writerUid}`}
                        prefetch={false}
                        className="mx-auto flex w-fit items-center gap-3 font-medium text-zinc-700"
                      >
                        {writerContent}
                      </Link>
                    ) : (
                      <div className="mx-auto flex w-fit items-center gap-3 font-medium text-zinc-700">
                        {writerContent}
                      </div>
                    )}
                  </td>
                  <td className="px-5 text-center font-semibold text-zinc-700">
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-5">
                    <span className="mx-auto flex w-fit items-center gap-3 text-zinc-600">
                      <Eye className="h-4 w-4" />
                      <span>{post.viewCount}</span>
                    </span>
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
