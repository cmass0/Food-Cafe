"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

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

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await deleteUser(userId);
      router.push("/");
    } catch {
      setError("계정 삭제에 실패했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-destructive">계정 삭제</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              계정을 삭제하면 작성한 게시물, 댓글, 좋아요, 북마크 데이터가 영구적으로 삭제됩니다.
            </p>
            {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={loading}
              className="w-full gap-2 sm:w-fit sm:self-end"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {loading ? "삭제 중..." : "계정 삭제"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>정말 계정을 삭제하시겠습니까?</AlertDialogTitle>
              <AlertDialogDescription>
                이 작업은 되돌릴 수 없습니다. 계정과 관련된 레시피, 조합, 댓글, 좋아요, 북마크
                데이터가 영구적으로 삭제됩니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>취소</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                삭제하기
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
