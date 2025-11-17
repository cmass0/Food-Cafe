"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/app/auth/auth-context";
import { useAuthModal } from "@/features/auth/ui/AuthModalProvider";
import { CommentForm } from "./CommentForm";
import { CommentList, type CommentDisplayItem } from "./CommentList";
import { createComment, deleteComment, listComments } from "../api";

type ParentType = "post" | "recipe";

type CommentThreadProps = {
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
  const [items, setItems] = useState<CommentDisplayItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [writerName, setWriterName] = useState(defaultWriterName);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { user, displayName } = useAuth();
  const { openAuthModal } = useAuthModal();

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
      setItems(
        Array.isArray(payload?.items)
          ? payload.items.map((item: any) => ({
              id: item.id,
              writerName: item.writerName,
              writerUid: item.writerUid,
              content: item.content,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              deletedAt: item.deletedAt,
            }))
          : []
      );
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

  const visiblePages = useMemo(() => {
    if (totalPages <= 1) return [];
    const pages = new Set<number>([1, totalPages]);
    for (let i = page - 1; i <= page + 1; i += 1) {
      if (i > 1 && i < totalPages) pages.add(i);
    }
    return Array.from(pages).sort((a, b) => a - b);
  }, [page, totalPages]);

  const formatDate = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("ko-KR");
  };

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

    const effectiveWriterName =
      writerName.trim() ||
      displayName ||
      user.email ||
      (user.user_metadata?.name as string | undefined) ||
      "익명";

    setSubmitting(true);
    setError(null);
    try {
      await createComment({
        parentType,
        parentId,
        writerName: effectiveWriterName,
        content: content.trim(),
      });
      if (!writerName.trim()) {
        setWriterName(effectiveWriterName);
      }
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
    <section className="space-y-4 pt-4">
      <CommentForm
        content={content}
        submitting={submitting}
        error={error}
        onChange={(value) => setContent(value)}
        onSubmit={handleSubmit}
      />

      <CommentList
        items={items}
        loading={loading}
        onDelete={handleDelete}
        formatDate={formatDate}
      />

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={page <= 1}
                prefetch={false}
                onClick={(event) => {
                  event.preventDefault();
                  if (page <= 1) return;
                  setPage((prev) => Math.max(1, prev - 1));
                }}
              />
            </PaginationItem>
            {visiblePages.map((pageNumber, index) => {
              const prev = visiblePages[index - 1];
              const needsEllipsis = index > 0 && prev !== undefined && pageNumber - prev > 1;
              return (
                <React.Fragment key={pageNumber}>
                  {needsEllipsis ? (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : null}
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === page}
                      prefetch={false}
                      onClick={(event) => {
                        event.preventDefault();
                        if (pageNumber === page) return;
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                </React.Fragment>
              );
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={page >= totalPages}
                prefetch={false}
                onClick={(event) => {
                  event.preventDefault();
                  if (page >= totalPages) return;
                  setPage((prev) => Math.min(totalPages, prev + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </section>
  );
}
