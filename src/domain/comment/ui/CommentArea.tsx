import { listComments } from "@/domain/comment/service";
import type { CommentDisplayItem, CommentParentTypeEnum } from "@/domain/comment/types";
import { PaginationComponent } from "@/lib/pagenation/pagenation";
import { getServerSupabase } from "@/lib/supabase/server";
import CommentThread from "./CommentThread.client";

type Props = {
  parentType: CommentParentTypeEnum;
  parentId: string;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  pageParam?: string;
  limit?: number;
};

export default async function CommentArea({
  parentType,
  parentId,
  basePath,
  searchParams,
  pageParam = "commentPage",
  limit = 5,
}: Props) {
  const pageValue = searchParams?.[pageParam];
  const pageNumber = Number(pageValue);
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;

  const supabase = getServerSupabase();
  const { items, total } = await listComments(supabase, {
    parentType,
    parentId,
    page: currentPage,
    limit,
  });

  const displayItems: CommentDisplayItem[] = items.map((comment) => ({
    id: comment.id,
    writerName: comment.writerName,
    writerUid: comment.writerUid,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
    deletedAt: comment.deletedAt ? comment.deletedAt.toISOString() : null,
  }));

  return (
    <section className="space-y-4 border-t border-border/60 pt-8">
      <CommentThread
        parentType={parentType}
        parentId={parentId}
        pageSize={limit}
        items={displayItems}
      />
      <PaginationComponent
        basePath={basePath}
        page={currentPage}
        pageItemSize={limit}
        total={total}
        pageParam={pageParam}
      />
    </section>
  );
}
