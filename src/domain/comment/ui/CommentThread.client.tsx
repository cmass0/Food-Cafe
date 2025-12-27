"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { createComment, deleteComment } from "../api";
import type { CommentDisplayItem } from "../types";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";

type ParentType = "post" | "recipe";

type CommentThreadProps = {
  parentType: ParentType;
  parentId: string;
  pageSize?: number;
  items: CommentDisplayItem[];
  defaultWriterName?: string;
};

export default function CommentThread({
  parentType,
  parentId,
  pageSize,
  items,
}: CommentThreadProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, displayName } = useAuth();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();

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
      await createComment({
        parentType,
        parentId,
        writerName: displayName || user.user_metadata?.name || user.email,
        content: content.trim(),
      });
      setContent("");
      router.refresh();
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
      router.refresh();
    } catch (err) {
      console.error("Failed to delete comment", err);
      setError("댓글을 삭제하는 중 오류가 발생했습니다.");
    }
  };

  return (
    <section className="space-y-4 pt-4">
      <CommentForm
        content={content}
        submitting={submitting}
        error={error}
        onChange={setContent}
        onSubmit={handleSubmit}
      />
      <CommentList items={items} onDelete={handleDelete} />
    </section>
  );
}
