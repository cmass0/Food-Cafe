import { notFound } from "next/navigation";

import { getServerSupabase } from "@/lib/supabase/server";
import * as postService from "@/features/post/service";
import PostDetail from "@/features/post/ui/PostDetail";
import CommentArea from "@/component/comment/comment";
import PostForm from "@/features/post/ui/PostForm";
import { Button } from "@/components/ui/button";
import { deletePostAction, updatePostAction } from "../actions";

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const post = await postService.getPost(supabase, params.id);
  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <PostDetail post={post} />

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">게시글 수정</h2>
        <PostForm
          action={updatePostAction}
          defaultValues={{
            id: post.id,
            title: post.title,
            content: post.content,
            type: post.type,
            writerName: post.writerName,
          }}
          submitLabel="수정"
          cancelHref="/posts"
        />
        <form action={deletePostAction} className="flex justify-end border-t border-border pt-4">
          <input type="hidden" name="id" value={post.id} />
          <Button type="submit" variant="destructive">
            삭제
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">댓글</h2>
        <CommentArea type={post.id} />
      </section>
    </main>
  );
}
