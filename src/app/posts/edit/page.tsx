import PostForm from "@/features/post/ui/PostForm";
import { getServerSupabase } from "@/lib/supabase/server";
import * as postService from "@/features/post/service";
import { notFound } from "next/navigation";
import { updatePostAction } from "../actions";

export default async function PostEditPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams?.id;
  if (!id) notFound();

  const supabase = getServerSupabase();
  const post = await postService.getPost(supabase, id);
  if (!post) {
    notFound();
  }

  return (
    <PostForm
      action={updatePostAction as any}
      defaultValues={{
        id: post.id,
        title: post.title ?? "",
        content: post.content ?? "",
        type: post.type ?? "board",
      }}
      submitLabel="수정"
      cancelHref="/posts"
    />
  );
}
