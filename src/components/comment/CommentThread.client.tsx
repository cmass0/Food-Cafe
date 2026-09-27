"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { createComment, deleteComment } from "@/domain/comment/api";
import type { CommentDisplayItem } from "@/domain/comment/types";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";

type ParentType = "post" | "recipe" | "combo";

type CommentThreadProps = {
  parentType: ParentType;
  parentId: string;
  pageSize?: number;
  items: CommentDisplayItem[];
  initialTotal: number;
  showTitle: boolean;
  defaultWriterName?: string;
};

export default function CommentThread({
  parentType,
  parentId,
  items,
  initialTotal,
  showTitle,
}: CommentThreadProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 목록과 카운트를 클라이언트 상태로 관리 — 응답값으로 즉시 갱신, router.refresh() 불필요
  const [list, setList] = useState<CommentDisplayItem[]>(items);
  const [total, setTotal] = useState(initialTotal);

  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleSubmit = async () => {
    if (!content.trim()) return;

    if (!user) {
      const next =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/posts";
      openAuthModal({ next });
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { comment, parentCommentCount } = await createComment({
        parentType,
        parentId,
        content: content.trim(),
      });

      // 응답으로 받은 새 댓글을 맨 앞에 추가, 카운트는 서버가 알려준 값으로 동기화
      const newItem: CommentDisplayItem = {
        id: comment.id,
        writerName: comment.writerName,
        writerUid: comment.writerUid,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        deletedAt: comment.deletedAt,
      };
      setList((prev) => [newItem, ...prev]);
      setTotal(parentCommentCount);
      setContent("");
    } catch (err) {
      console.error("Failed to create comment", err);
      setError("댓글을 작성하는 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { parentCommentCount } = await deleteComment(id);
      // 해당 댓글을 deleted_at 처리 (목록에서 완전히 제거하지 않고 "삭제됨" 표시)
      const deletedAt = new Date().toISOString();
      setList((prev) =>
        prev.map((item) => (item.id === id ? { ...item, deletedAt } : item))
      );
      setTotal(parentCommentCount);
    } catch (err) {
      console.error("Failed to delete comment", err);
      setError("댓글을 삭제하는 중 오류가 발생했습니다.");
    }
  };

  return (
    <section className="space-y-4 pt-4">
      {showTitle ? (
        <h2 className="text-lg font-black text-zinc-950">댓글 {total}</h2>
      ) : null}
      <CommentForm
        content={content}
        submitting={submitting}
        error={error}
        onChange={setContent}
        onSubmit={handleSubmit}
      />
      <CommentList items={list} onDelete={handleDelete} />
    </section>
  );
}
