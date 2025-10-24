import { notFound } from "next/navigation";

import { getServerSupabase } from "@/lib/supabase/server";
import * as postService from "@/features/post/service";
import PostDetail from "@/features/post/ui/PostDetail";

import DeleteButton from "./DeleteButton";
import { deletePostAction } from "../actions";
import PostViewIncrement from "@/features/post/ui/PostViewIncrement.client";
import UpdateButton from "./UpdateButton";

export default async function PostDetailPage({ params }: { params: { id: string } }) {
  const supabase = getServerSupabase();
  const post = await postService.getPost(supabase, params.id);
  if (!post) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id && post.writerUid ? user.id === post.writerUid : false;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-10">
      <PostViewIncrement id={post.id} />
      <PostDetail post={post} />

      {isAuthor && (
        <section className="space-y-4">
          <UpdateButton id={post.id} />
          <DeleteButton action={deletePostAction} id={post.id} />
        </section>
      )}
    </main>
  );
}
