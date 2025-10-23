import PostViewIncrement from "./PostViewIncrement.client";
import type { Post } from "../types";

export default function PostDetail({ post }: { post: Post }) {
  return (
    <article className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Author {post.writerName}</span>
          <span aria-hidden="true">|</span>
          <span>{post.createdAt.toLocaleString("ko-KR")}</span>
          <span aria-hidden="true">|</span>
          <PostViewIncrement id={post.id} initialCount={post.check} />
          {post.type ? (
            <>
              <span aria-hidden="true">|</span>
              <span>{post.type}</span>
            </>
          ) : null}
        </div>
      </header>
      <section className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}

