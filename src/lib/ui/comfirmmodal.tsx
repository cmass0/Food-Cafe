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

type props = {
  btnText: string; // 모달 호출 버튼 텍스트
  comfirmText: React.ReactNode; // 확인할 텍스트 jsx.Element 도 가능
  content: string; // 모달 내용
  comfirmtype: string; // 결정을 수락할 내용의 종류
  oncomfirm?: () => void; // 확인 버튼 클릭 시 실행할 함수
  triggerClassName?: string; // 모달 호출 버튼에 대한 클래스
  comfirmClassName?: string; // 결정 수락 버튼에 대한 클래스
};

export default function ComfirmModal({
  btnText,
  comfirmText,
  content,
  comfirmtype,
  oncomfirm,
  triggerClassName,
  comfirmClassName,
}: props) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className={triggerClassName}>
          {btnText}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{comfirmText}</AlertDialogTitle>
          <AlertDialogDescription>{content}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={oncomfirm} className={comfirmClassName}>
            {comfirmtype}
          </AlertDialogAction>
          <AlertDialogCancel>닫기</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
