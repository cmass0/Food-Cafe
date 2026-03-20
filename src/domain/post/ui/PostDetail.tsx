import { Separator } from "@/components/ui/separator";
import AuthorProfileMenu from "@/components/user/AuthorProfileMenu";
import ViewCount from "@/domain/view/ui/ViewCount.client";
import type { Post } from "../types";

export default function PostDetail({ post }: { post: Post }) {
  return (
    <div>
      <article className="space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-semibold pb-3">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              작성자 <AuthorProfileMenu name={post.writerName} userId={post.writerUid} />
            </span>
            <Separator orientation="vertical" className="mx-1 h-4 bg-gray-700" />
            <span>{post.createdAt.toLocaleString("ko-KR")}</span>
            <Separator orientation="vertical" className="mx-1 h-4 bg-gray-700" />
            <span>
              조회수 <ViewCount type="post" id={post.id} initialCount={post.viewCount} />
            </span>
            {post.type ? (
              <>
                <Separator orientation="vertical" className="mx-1 h-4 bg-gray-700 " />
                <span>{post.type}</span>
              </>
            ) : null}
          </div>
        </header>
        {post.contentHtml ? (
          <section
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />
        ) : null}
      </article>
    </div>
  );
}
