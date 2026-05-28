import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import CommentArea from "@/domain/comment/ui/CommentArea";
import * as postService from "@/domain/post/service";
import PostDetail from "@/domain/post/ui/PostDetail";
import { getServerSupabase } from "@/lib/supabase/server";

import DeleteButton from "./DeleteButton";
import UpdateButton from "./UpdateButton";

const commentLimit = 10;

export default async function PostDetailPage(
  props: {
    params: Promise<{ id: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  noStore();
  const supabase = await getServerSupabase();
  const post = await postService.getPost(supabase, params.id);
  if (!post) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id && post.writerUid ? user.id === post.writerUid : false;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <PostDetail post={post} />

      {isAuthor && (
        <section className="space-y-4 py-10">
          <div className=" flex gap-2.5 justify-end">
            <UpdateButton id={post.id} />
            <DeleteButton id={post.id} />
          </div>
        </section>
      )}

      <CommentArea
        parentType="post"
        parentId={post.id}
        basePath={`/posts/${params.id}`}
        searchParams={searchParams ?? {}}
        limit={commentLimit}
      />
    </main>
  );
}
