"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { listComments, createComment, deleteComment } from "@/features/comment/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ParentType = "post" | "recipe";

type CommentItem = {
  id: string;
  writerName: string;
  writerUid: string | null;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
};

type Props = {
  parentType: ParentType;
  parentId: string;
  pageSize?: number;
  defaultWriterName?: string;
};

export default function CommentThread({
  parentType,
  parentId,
  pageSize = 20,
  defaultWriterName = "",
}: Props) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CommentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [writerName, setWriterName] = useState(defaultWriterName);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await listComments({
        parentType,
        parentId,
        page,
        limit: pageSize,
      });
      const list: CommentItem[] = (payload?.items ?? []).map((c: any) => ({
        id: c.id,
        writerName: c.writerName,
        writerUid: c.writerUid ?? null,
        content: c.content,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        deletedAt: c.deletedAt ?? null,
      }));
      setItems(list);
      setTotal(payload?.total ?? 0);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoading(false);
    }
  }, [parentType, parentId, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || !writerName.trim()) return;
    try {
      setSubmitting(true);
      await createComment({
        content: content.trim(),
        parentType,
        parentId,
        writerName: writerName.trim(),
      });
      setContent("");
      // 새로 작성된 댓글이 첫 페이지에 보이도록 첫 페이지로 이동
      setPage(1);
      await load();
    } catch (err) {
      console.error("Failed to create comment", err);
    } finally {
      setSubmitting(false);
    }
  }, [content, writerName, parentType, parentId, load]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteComment(id);
        await load();
      } catch (err) {
        console.error("Failed to delete comment", err);
      }
    },
    [load]
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Input
          placeholder="작성자 이름"
          value={writerName}
          onChange={(e) => setWriterName(e.target.value)}
        />
        <Textarea
          placeholder="댓글을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !content.trim() || !writerName.trim()}
          >
            {submitting ? "작성 중..." : "댓글 작성"}
          </Button>
        </div>
      </div>

      <div className="divide-y rounded-md border">
        {loading ? (
          <div className="p-4 text-sm text-muted-foreground">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">첫 번째 댓글을 남겨보세요.</div>
        ) : (
          items.map((c) => {
            const isDeleted = !!c.deletedAt;
            return (
              <div key={c.id} className="flex items-start justify-between gap-3 p-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{c.writerName || "익명"}</div>
                  <div className={"text-sm " + (isDeleted ? "text-muted-foreground italic" : "")}>
                    {isDeleted ? "삭제된 댓글입니다." : c.content}
                  </div>
                </div>
                {!isDeleted && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>
                    삭제
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">전체 {total}개</div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            이전
          </Button>
          <div className="text-sm leading-9">
            {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
