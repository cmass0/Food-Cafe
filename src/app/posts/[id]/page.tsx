import { notFound } from "next/navigation";

import { getServerSupabase } from "@/lib/supabase/server";
import * as postService from "@/features/post/service";
import * as commentService from "@/features/comment/service";
import PostDetail from "@/features/post/ui/PostDetail";
import CommentThread from "@/features/comment/ui/CommentThread.client";
import { PaginationComponent } from "@/components/pagenation/pagenation";

import DeleteButton from "./DeleteButton";
import { deletePostAction } from "../actions";
import PostViewIncrement from "@/features/post/ui/PostViewIncrement.client";
import UpdateButton from "./UpdateButton";
import { CommentDisplayItem } from "@/features/comment/types";

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { commentPage?: SearchParamValue };
}) {
  const supabase = getServerSupabase();
  const post = await postService.getPost(supabase, params.id);
  if (!post) {
    notFound();
  }

  const commentPageValue = firstValue(searchParams?.commentPage);
  const commentPageNumber = Number(commentPageValue);
  const commentLimit = 10;

  const {
    items: commentRecords,
    total: commentTotal,
    offset: commentOffset,
  } = await commentService.listComments(supabase, {
    parentType: "post",
    parentId: params.id,
    page: Number.isFinite(commentPageNumber) ? commentPageNumber : undefined,
    limit: commentLimit,
  });

  const commentPageSize = commentLimit;
  const commentPageCurrent = Math.floor(commentOffset / commentPageSize) + 1;

  const comments: CommentDisplayItem[] = commentRecords.map((item) => ({
    id: item.id,
    writerName: item.writerName,
    writerUid: item.writerUid,
    content: item.content,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
  }));

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthor = user?.id && post.writerUid ? user.id === post.writerUid : false;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-6 py-10">
      <PostViewIncrement id={post.id} />
      <PostDetail post={post} />

      {isAuthor && (
        <section className="space-y-4 pt-10">
          <div className=" flex gap-2.5 justify-end">
            <UpdateButton id={post.id} />
            <DeleteButton action={deletePostAction} id={post.id} />
          </div>
        </section>
      )}

      <section className="space-y-4">
        <CommentThread
          parentType="post"
          parentId={post.id}
          items={comments}
          defaultWriterName={post.writerName ?? ""}
        />
        <PaginationComponent
          basePath={`/posts/${params.id}`}
          page={commentPageCurrent}
          pageSize={commentPageSize}
          total={commentTotal}
          pageParam="commentPage"
          limitParam="commentLimit"
        />
      </section>
    </main>
  );
}
