import AuthorProfileMenu from "@/components/user/AuthorProfileMenu";
import ViewCount from "@/domain/view/ui/ViewCount.client";
import type { Post } from "../types";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function PostDetail({ post }: { post: Post }) {
  return (
    <div>
      <article className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              작성자 <AuthorProfileMenu name={post.writerName} userId={post.writerUid} />
            </span>
            <span>|</span>
            <span>{post.createdAt.toLocaleString("ko-KR")}</span>
            <span>|</span>
            <span>
              조회수 <ViewCount type="post" id={post.id} initialCount={post.check} />
            </span>
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
    </div>
  );
}
