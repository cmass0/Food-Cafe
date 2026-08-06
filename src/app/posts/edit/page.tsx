import * as postService from "@/domain/post/service";
import PostForm from "@/domain/post/ui/PostForm";
import { requireOwnedContent } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import { updatePostAction } from "../actions";

export default async function PostEditPage(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams;
  const id = searchParams?.id;
  if (!id) notFound();

  const next = `/posts/edit?id=${encodeURIComponent(id)}`;
  const post = await requireOwnedContent(next, (supabase) => postService.getPost(supabase, id));

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-10 md:px-8">
      <PostForm
        action={updatePostAction}
        defaultValues={{
          id: post.id,
          title: post.title ?? "",
          contentJson: post.contentJson,
          category: post.category,
        }}
        submitLabel="수정"
        cancelHref="/posts"
      />
    </main>
  );
}
