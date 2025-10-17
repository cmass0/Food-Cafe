import type { Post } from "../types";

export default function PostDetail({ post }: { post: Post }) {
  return (
    <article className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>작성자 {post.writerName}</span>
          <span>|</span>
          <span>{post.createdAt.toLocaleString("ko-KR")}</span>
          <span>|</span>
          <span>조회수 {post.check}</span>
          {post.type ? (
            <>
              <span>|</span>
              <span>{post.type}</span>
            </>
          ) : null}
        </div>
      </header>
      <section className="prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
