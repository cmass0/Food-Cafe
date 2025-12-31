import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import { PaginationComponent } from "@/components/pagenation/pagenation";
import * as commentService from "@/domain/comment/service";
import CommentThread from "@/domain/comment/ui/CommentThread.client";
import * as postService from "@/domain/post/service";
import PostDetail from "@/domain/post/ui/PostDetail";
import { getServerSupabase } from "@/lib/supabase/server";

import { CommentDisplayItem } from "@/domain/comment/types";
import { deletePostAction } from "../actions";
import DeleteButton from "./DeleteButton";
import UpdateButton from "./UpdateButton";

type SearchParamValue = string | string[] | undefined;

function firstValue(value: SearchParamValue): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default async function PostDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { commentPage?: SearchParamValue };
}) {
  noStore();
  const supabase = getServerSupabase();
  const post = await postService.getPost(supabase, params.id);
  if (!post) {
    notFound();
  }

  const commentPageValue = firstValue(searchParams?.commentPage);
  const commentPageNumber = Number(commentPageValue);
  const commentPage = Number.isFinite(commentPageNumber) && commentPageNumber > 0 ? commentPageNumber : 1;
  const commentLimit = 10;

  const {
    items: commentRecords,
    total: commentTotal,
  } = await commentService.listComments(supabase, {
    parentType: "post",
    parentId: params.id,
    page: commentPage,
    limit: commentLimit,
  });

  const commentPageSize = commentLimit;
  const commentPageCurrent = commentPage;

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
          pageSize={commentPageSize}
          items={comments}
        />
        <PaginationComponent
          basePath={`/posts/${params.id}`}
          page={commentPageCurrent}
          pageItemSize={commentPageSize}
          total={commentTotal}
          pageParam="commentPage"
          limitParam="commentLimit"
        />
      </section>
    </main>
  );
}
