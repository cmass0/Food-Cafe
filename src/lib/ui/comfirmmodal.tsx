"use client";

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

type Props = {
  btnText?: string; // 모달 호출 버튼 텍스트
  comfirmText: React.ReactNode; // 확인할 텍스트 jsx.Element 도 가능
  content: string; // 모달 내용
  comfirmtype: string; // 결정을 수락할 내용의 종류
  oncomfirm?: () => void; // 확인 버튼 클릭 시 실행할 함수
  triggerClassName?: string; // 모달 호출 버튼에 대한 클래스
  comfirmClassName?: string; // 결정 수락 버튼에 대한 클래스
  cancelText?: string; // 취소 버튼 텍스트
  showTrigger?: boolean; // 트리거 버튼 표시 여부
  open?: boolean; // 모달 열림 상태 제어
  onOpenChange?: (open: boolean) => void; // 모달 열림 상태 변경 핸들러
  onCloseAutoFocus?: (event: Event) => void; // 트리거 없는 모달의 포커스 복원
};

export default function ComfirmModal({
  btnText,
  comfirmText,
  content,
  comfirmtype,
  oncomfirm,
  triggerClassName,
  comfirmClassName,
  cancelText = "취소",
  showTrigger = true,
  open,
  onOpenChange,
  onCloseAutoFocus,
}: Props) {
  const alertDialogProps =
    typeof open === "boolean" ? ({ open, onOpenChange } as const) : ({} as const);

  return (
    <AlertDialog {...alertDialogProps}>
      {showTrigger ? (
        <AlertDialogTrigger asChild>
          <Button variant="outline" className={triggerClassName}>
            {btnText ?? "확인"}
          </Button>
        </AlertDialogTrigger>
      ) : null}
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <AlertDialogHeader>
          <AlertDialogTitle>{comfirmText}</AlertDialogTitle>
          <AlertDialogDescription>{content}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={oncomfirm} className={comfirmClassName}>
            {comfirmtype}
          </AlertDialogAction>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
