"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { Post } from "../types";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/features/auth/ui/AuthModalProvider";
import { Button } from "@/components/ui/button";
import AuthorProfileMenu from "@/components/user/AuthorProfileMenu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PostListProps = {
  posts: Post[];
  className?: string;
  showCreateLink?: boolean;
};

function formatDate(date: Date) {
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return sameYear ? `${month}-${day}` : `${year}-${month}-${day}`;
}

export default function PostList({ posts, className, showCreateLink = true }: PostListProps) {
  const route = useRouter();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleCreateClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!user) {
        event.preventDefault();
        openAuthModal({ next: "/posts/new" });
        return;
      }
      route.push("/posts/new");
    },
    [user, openAuthModal, route]
  );

  return (
    <div className="">
      {showCreateLink ? (
        <div className="mb-4 flex justify-end">
          <Button
            className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
            onClick={handleCreateClick}
          >
            글쓰기
          </Button>
        </div>
      ) : null}

      {posts.length === 0 && <p className={className}>등록된 게시글이 없습니다.</p>}

      {posts.length !== 0 && (
        <Table>
          <TableHeader className="bg-emerald-100">
            <TableRow className="text">
              <TableHead className="w-[100px] text-center">번호</TableHead>
              <TableHead className="w-2/5 text-center">제목</TableHead>
              <TableHead className="w-1/5 text-center">글쓴이</TableHead>
              <TableHead className="w-[140px] text-center">날짜</TableHead>
              <TableHead className="w-[80px] text-center">조회</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post, index) => {
              const rowNumber = post.number ?? index + 1;

              return (
                <TableRow key={post.id}>
                  <TableCell className="w-[100px] text-center font-medium">{rowNumber}</TableCell>
                  <TableCell className="text-left">
                    <Link
                      className="line-clamp-1 text-base font-semibold text-primary"
                      href={`/posts/${post.id}`}
                      prefetch={false}
                    >
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell className="truncate text-center">
                    <AuthorProfileMenu name={post.writerName} userId={post.writerUid} />
                  </TableCell>
                  <TableCell className="text-center">{formatDate(post.createdAt)}</TableCell>
                  <TableCell className="w-[80px] text-center text-xs text-muted-foreground">
                    {post.check}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
