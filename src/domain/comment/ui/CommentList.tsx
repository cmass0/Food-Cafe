"use client";

import { useAuth } from "@/app/auth/auth-context";
import ComfirmModal from "@/lib/ui/comfirmmodal";
import type { CommentDisplayItem } from "../types";
import { TriangleAlert } from "lucide-react";

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
                <ComfirmModal
                  btnText="삭제"
                  comfirmText={
                    <div className="flex items-center gap-2">
                      <TriangleAlert className="text-[#f55151]" />
                      댓글을 삭제하시겠습니까?
                    </div>
                  }
                  content="댓글을 삭제하면 복구할 수 없습니다. 삭제를 원하시면 확인 버튼을 눌러주세요."
                  comfirmtype="삭제"
                  oncomfirm={async () => {
                    onDelete(item.id);
                  }}
                  triggerClassName="border-none hover-none"
                  comfirmClassName="bg-red-400 text-white hover:bg-red-500"
                />
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
