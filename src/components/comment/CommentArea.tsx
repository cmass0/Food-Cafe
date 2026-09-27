import Section from "@/components/status/Section";
import { listComments } from "@/domain/comment/service";
import type {
  CommentDisplayItem,
  CommentListResult,
  CommentParentType,
} from "@/domain/comment/types";
import { PaginationComponent } from "@/components/Pagination";
import { loadSection } from "@/lib/errors/section";
import { getServerSupabase } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import CommentThread from "./CommentThread.client";

type Props = {
  parentType: CommentParentType;
  parentId: string;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  pageParam?: string;
  limit?: number;
  className?: string;
  showTitle?: boolean;
};

export default async function CommentArea({
  parentType,
  parentId,
  basePath,
  searchParams,
  pageParam = "commentPage",
  limit = 5,
  className,
  showTitle = false,
}: Props) {
  const pageValue = searchParams?.[pageParam];
  const pageNumber = Number(pageValue);
  const currentPage = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const paginationQuery = { ...searchParams };
  delete paginationQuery[pageParam];

  const supabase = await getServerSupabase();
  const commentsResult = await loadSection<CommentListResult>(
    `comments.${parentType}`,
    () =>
      listComments(supabase, {
        parentType,
        parentId,
        page: currentPage,
        limit,
      }),
    {
      items: [],
      total: 0,
      limit,
      offset: (currentPage - 1) * limit,
      hasMore: false,
    }
  );

  const { items, total } = commentsResult.data;

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
    <section className={cn("space-y-4 border-t border-border/60 pt-8", className)}>
      <Section
        name={`comments.${parentType}`}
        failed={commentsResult.error}
        outOfRange={commentsResult.outOfRange}
        pageParam={pageParam}
        title="댓글을 표시하지 못했습니다."
        compact
        resetKeys={[parentId, currentPage, limit]}
      >
        {/* key에 page를 포함 — 페이지 이동 시 CommentThread를 다시 mount해 SSR 데이터로 초기화 */}
        <CommentThread
          key={`${parentId}-${currentPage}`}
          parentType={parentType}
          parentId={parentId}
          pageSize={limit}
          items={displayItems}
          initialTotal={total}
          showTitle={showTitle}
        />
        <PaginationComponent
          basePath={basePath}
          page={currentPage}
          pageItemSize={limit}
          total={total}
          query={paginationQuery}
          pageParam={pageParam}
        />
      </Section>
    </section>
  );
}
