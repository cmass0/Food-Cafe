import { unstable_noStore as noStore } from "next/cache";
import { notFound } from "next/navigation";

import CommentArea from "@/domain/comment/ui/CommentArea";
import * as postService from "@/domain/post/service";
import PostDetail from "@/domain/post/ui/PostDetail";
import PostList from "@/domain/post/ui/PostList";
import { getPostCategoryLabel } from "@/domain/post/category";
import { PaginationComponent } from "@/lib/pagenation/pagenation";
import { getContentPermissions } from "@/lib/auth/content-permissions";
import { getServerSupabase } from "@/lib/supabase/server";

import DeleteButton from "./DeleteButton";
import UpdateButton from "./UpdateButton";
import PostBoardToolbar from "../components/PostBoardToolbar.client";

const commentLimit = 10;
const postListLimit = 10;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), max);
}

export default async function PostDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  noStore();
  const supabase = await getServerSupabase();
  const post = await postService.getPost(supabase, params.id);
  if (!post) {
    notFound();
  }

  const requestedListPage = positiveInteger(
    firstValue(searchParams?.listPage),
    1,
    Number.MAX_SAFE_INTEGER
  );
  const listLimit = positiveInteger(
    firstValue(searchParams?.listLimit),
    postListLimit,
    postListLimit
  );
  let listPage = requestedListPage;
  let boardPosts = await postService.listPosts(supabase, {
    page: listPage,
    limit: listLimit,
    category: post.category,
  });
  const totalBoardPages = Math.max(1, Math.ceil(boardPosts.total / listLimit));

  // The post can be opened from an unfiltered list. In that case, use the
  // final valid page in the post's own category instead of rendering no rows.
  if (listPage > totalBoardPages) {
    listPage = totalBoardPages;
    boardPosts = await postService.listPosts(supabase, {
      page: listPage,
      limit: listLimit,
      category: post.category,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const permissions = await getContentPermissions(supabase, user?.id, post.writerUid);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-9 md:px-8 md:py-10">
      <div className="mx-auto flex w-full flex-col">
        <PostDetail post={post} />

        {permissions.canEdit || permissions.canDelete ? (
          <section className="space-y-4 py-10">
            <div className=" flex gap-2.5 justify-end">
              {permissions.canEdit ? <UpdateButton id={post.id} /> : null}
              {permissions.canDelete ? <DeleteButton id={post.id} /> : null}
            </div>
          </section>
        ) : null}

        <CommentArea
          parentType="post"
          parentId={post.id}
          basePath={`/posts/${params.id}`}
          searchParams={searchParams ?? {}}
          limit={commentLimit}
          showTitle
        />
      </div>

      <section className="mt-12 border-t border-border/70 pt-8">
        <h2 className="text-xl font-black tracking-tight text-zinc-950">
          {getPostCategoryLabel(post.category)} 목록
        </h2>
        <div className="mt-5">
          <PostBoardToolbar category={post.category} />
        </div>
        <PostList
          className="mt-5"
          posts={boardPosts.items}
          activePostId={post.id}
          detailListContext={{ listPage, listLimit }}
          variant="board"
        />

        <div className="mt-6 flex justify-center">
          <PaginationComponent
            basePath={`/posts/${post.id}`}
            page={listPage}
            pageItemSize={listLimit}
            total={boardPosts.total}
            pageParam="listPage"
            query={{ listLimit: String(listLimit) }}
            scroll={false}
          />
        </div>
      </section>
    </main>
  );
}
