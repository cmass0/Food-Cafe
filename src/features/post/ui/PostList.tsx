"use client";

import * as React from "react";
import Link from "next/link";

import type { Post } from "../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type PostListProps = {
  posts: Post[];
  className?: string;
  showCreateLink?: boolean;
};

export default function PostList({ posts, className, showCreateLink = true }: PostListProps) {
  const [errorOpen, setErrorOpen] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function incrementViewHandler(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkIncrement: true }),
      });
      if (!res.ok) {
        let detail = "";
        try {
          const data = await res.json();
          detail = typeof data?.error === "string" ? ` (${data.error})` : "";
        } catch {}
        throw new Error(`조회수 증가 실패${detail}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      setErrorMessage(msg);
      setErrorOpen(true);
    }
  }

  return (
    <div className="border-border w-full rounded-md border p-4">
      {showCreateLink ? (
        <div className="mb-4 flex justify-end">
          <Link className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground" href="/posts/new">
            새 글 쓰기
          </Link>
        </div>
      ) : null}

      {posts.length === 0 && <p className={className}>등록된 게시글이 없습니다.</p>}

      {posts.length !== 0 && (
        <ul className="divide-y divide-border rounded border border-border bg-card">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  className="text-base font-semibold text-primary"
                  onClick={() => incrementViewHandler(post.id)}
                  href={`/posts/${post.id}`}
                >
                  {post.title}
                </Link>
                <span className="text-xs text-muted-foreground">조회수 {post.check}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>작성자 {post.writerName}</span>
                <span>•</span>
                <span>{post.createdAt.toLocaleDateString("ko-KR")}</span>
                {post.type ? (
                  <>
                    <span>•</span>
                    <span>{post.type}</span>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>알림</DialogTitle>
            <DialogDescription>
              {errorMessage ?? "요청 처리 중 오류가 발생했습니다."}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

