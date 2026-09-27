"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import ConfirmModal from "@/components/ConfirmModal";

export type FormMode = "create" | "edit";

type Props = {
  mode: FormMode;
  resourceLabel: string;
  pending: boolean;
  dirty: boolean;
  cancelHref: string;
};

// 내용이 변경된 경우에만 취소 확인을 받고, 모든 폼의 제출 문구를 동일하게 표시합니다.
export function FormActionBar({ mode, resourceLabel, pending, dirty, cancelHref }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const editing = mode === "edit";

  return (
    <div className="flex justify-end gap-2">
      <ConfirmModal
        showTrigger={false}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
        comfirmText={`${resourceLabel} ${editing ? "수정" : "작성"}을 취소하시겠습니까?`}
        content="변경한 내용은 저장되지 않습니다."
        comfirmtype="나가기"
        cancelText={editing ? "계속 수정" : "계속 작성"}
        oncomfirm={() => {
          if (!pending) router.push(cancelHref);
        }}
      />
      <Button
        ref={cancelRef}
        type="button"
        variant="outline"
        className="h-11"
        disabled={pending}
        onClick={() => (dirty ? setConfirmOpen(true) : router.push(cancelHref))}
      >
        취소
      </Button>
      <Button type="submit" className="h-11 min-w-20" disabled={pending}>
        {pending ? (editing ? "수정 중..." : "등록 중...") : editing ? "수정" : "등록"}
      </Button>
    </div>
  );
}
