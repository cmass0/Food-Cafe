"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createComment, deleteComment, listComments } from "../api";

type ParentType = "post" | "recipe";

type CommentListItem = {
  id: string;
  writerName: string;
  writerUid: string | null;
  content: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
};

export type CommentThreadProps = {
  parentType: ParentType;
  parentId: string;
  pageSize?: number;
  defaultWriterName?: string;
};

export default function CommentThread({
  parentType,
  parentId,
  pageSize = 10,
  defaultWriterName = "",
}: CommentThreadProps) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<CommentListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writerName, setWriterName] = useState(defaultWriterName);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await listComments({
        parentType,
        parentId,
        page,
        limit: pageSize,
      });
      setItems(Array.isArray(payload?.items) ? payload.items : []);
      setTotal(payload?.total ?? 0);
    } catch (err) {
      console.error("Failed to load comments", err);
      setError("댓글을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, parentId, parentType]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const formatDate = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR");
  };

  const handleSubmit = async () => {
    if (!writerName.trim() || !content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await createComment({
        parentType,
        parentId,
        writerName: writerName.trim(),
        content: content.trim(),
      });
      setContent("");
      setPage(1);
      await fetchComments();
    } catch (err) {
      console.error("Failed to create comment", err);
      setError("댓글을 작성하는 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 댓글을 삭제하시겠습니까?")) return;
    setError(null);
    try {
      await deleteComment(id);
      await fetchComments();
    } catch (err) {
      console.error("Failed to delete comment", err);
      setError("댓글을 삭제하는 중 오류가 발생했습니다.");
    }
  };

  return (
    <section className="space-y-4">
      <div className="space-y-2 rounded-lg border p-4">
        <Input
          placeholder="작성자 이름"
          value={writerName}
          onChange={(event) => setWriterName(event.target.value)}
        />
        <Textarea
          placeholder="댓글을 입력해주세요."
          rows={4}
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !writerName.trim() || !content.trim()}
          >
            {submitting ? "작성 중..." : "댓글 작성"}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            첫 번째 댓글을 남겨보세요!
          </div>
        ) : (
          items.map((item) => {
            const isDeleted = Boolean(item.deletedAt);
            return (
              <div key={item.id} className="rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{item.writerName || "익명"}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.updatedAt ?? item.createdAt)}
                    </p>
                  </div>
                  {!isDeleted ? (
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      삭제
                    </Button>
                  ) : null}
                </div>
                <p className={`mt-2 text-sm ${isDeleted ? "text-muted-foreground italic" : ""}`}>
                  {isDeleted ? "삭제된 댓글입니다." : item.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
        <span className="text-muted-foreground">총 {total}개</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
            이전
          </Button>
          <span>
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            다음
          </Button>
        </div>
      </div>
    </section>
  );
}
