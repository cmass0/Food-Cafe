"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteUser } from "@/domain/user/api";

type Props = {
  userId: string;
};

export default function DeleteAccount({ userId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AlertDialog 확인 버튼 클릭 시 호출
  // API 성공 시 Auth 세션이 무효화되므로 바로 홈으로 리다이렉트
  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteUser(userId);
      router.push("/");
    } catch {
      setError("계정 삭제에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium text-destructive">계정 삭제</p>
      <p className="text-xs text-muted-foreground">
        계정을 삭제하면 모든 게시물, 댓글, 좋아요 등 데이터가 영구적으로 삭제됩니다.
      </p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <AlertDialog>
        {/* 1단계: 삭제 버튼 — 클릭 시 확인 다이얼로그 오픈 */}
        <AlertDialogTrigger asChild>
          <Button variant="destructive" disabled={loading} className="w-fit">
            {loading ? "삭제 중..." : "계정 삭제"}
          </Button>
        </AlertDialogTrigger>
        {/* 2단계: 최종 확인 다이얼로그 */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말로 탈퇴하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 계정 및 모든 관련 데이터(레시피, 조합, 댓글, 좋아요 등)가
              영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              탈퇴하기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
