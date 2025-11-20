"use client";

import { useAuth } from "@/app/auth/auth-context";
import { Button } from "@/components/ui/button";
import type { CommentDisplayItem } from "../types";

type CommentListProps = {
  items: CommentDisplayItem[];
  loading?: boolean;
  onDelete: (id: string) => void;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR");
};

export function CommentList({ items, loading, onDelete }: CommentListProps) {
  const currentUserID = useAuth().user?.id;

  if (loading) {
    return (
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">불러오는 중...</div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
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
              {!isDeleted && currentUserID === item.writerUid ? (
                <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                  삭제
                </Button>
              ) : null}
            </div>
            <p className={`mt-2 text-sm ${isDeleted ? "text-muted-foreground italic" : ""}`}>
              {isDeleted ? "삭제된 댓글입니다." : item.content}
            </p>
          </div>
        );
      })}
    </div>
  );
}
