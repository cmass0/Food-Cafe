"use client";

import * as React from "react";
import Link from "next/link";

import type { Post } from "../types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import SignInSignUpPage from "@/app/auth/signin-signup/page";
import { Button } from "@heroui/react";
import { useAuth } from "@/app/auth/auth-context";
import { useRouter } from "next/navigation";

type PostListProps = {
  posts: Post[];
  className?: string;
  showCreateLink?: boolean;
};

export default function PostList({ posts, className, showCreateLink = true }: PostListProps) {
  const [isLogin, setIsLogin] = React.useState(false);
  const user = useAuth().user;
  const route = useRouter();

  function userLoginHD() {
    if (!user) {
      alert("로그인이 필요한 서비스입니다.");
      setIsLogin(true);
    } else {
      route.push("/posts/new");
    }
  }

  return (
    <div className="border-border w-full rounded-md border p-4">
      {showCreateLink ? (
        <div className="mb-4 flex justify-end">
          <Button
            className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
            onClick={userLoginHD}
          >
            새 글 쓰기
          </Button>
        </div>
      ) : null}

      {posts.length === 0 && <p className={className}>등록된 게시글이 없습니다.</p>}

      {posts.length !== 0 && (
        <ul className="divide-y divide-border rounded border border-border bg-card">
          {posts.map((post) => (
            <li key={post.id} className="flex flex-col gap-1 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <Link className="text-base font-semibold text-primary" href={`/posts/${post.id}`}>
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

      <Dialog open={isLogin} onOpenChange={setIsLogin}>
        <DialogContent className="sm:max-w-[400px] p-0">
          <SignInSignUpPage />
        </DialogContent>
      </Dialog>
    </div>
  );
}
