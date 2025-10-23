import { notFound } from "next/navigation";

import { getServerSupabase } from "@/lib/supabase/server";
import * as postService from "@/features/post/service";
import PostDetail from "@/features/post/ui/PostDetail";
import CommentArea from "@/component/comment/comment";
import PostForm from "@/features/post/ui/PostForm";
import DeleteButton from "./DeleteButton";
import { deletePostAction, updatePostAction } from "../actions";

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const post = await postService.incrementPostView(supabase, params.id);
  if (!post) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id && post.writerUid ? user.id === post.writerUid : false;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <PostDetail post={post} />

      {isAuthor && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">게시글 수정</h2>
          <PostForm
            action={updatePostAction}
            defaultValues={{
              id: post.id,
              title: post.title,
              content: post.content,
              type: post.type,
            }}
            submitLabel="수정"
            cancelHref="/posts"
          />
          <DeleteButton action={deletePostAction} id={post.id} />
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">댓글</h2>
        <CommentArea type={post.id} />
      </section>
    </main>
  );
}
