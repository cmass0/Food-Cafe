import Link from "next/link";

import type { Post } from "../types";

type PostListProps = {
  posts: Post[];
  className?: string;
  showCreateLink?: boolean;
};

export default function PostList({ posts, className }: PostListProps) {
  return (
    <div className="border-border w-full rounded-md border p-4">
      {
        <div className="mb-4 flex justify-end">
          <Link
            className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground"
            href="/posts/new"
          >
            새 글 쓰기
          </Link>
        </div>
      }
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
    </div>
  );
}
