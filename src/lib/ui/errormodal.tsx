"use client";

import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ErrorModalAction = {
  label: string;
  onClick: () => void | Promise<void>;
  icon?: ReactNode;
  disabled?: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  onConfirm?: () => void;
  secondaryAction?: ErrorModalAction;
};

// 복구 가능한 클라이언트 오류를 같은 시각 언어와 접근성 구조로 안내한다.
// 삭제 여부를 묻는 ConfirmModal과 달리, 오류 사실과 사용 가능한 대체 행동에 집중한다.
export default function ErrorModal({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "확인",
  onConfirm,
  secondaryAction,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md gap-0 overflow-hidden rounded-2xl border-destructive/20 p-0">
        <div className="border-b border-destructive/10 bg-destructive/5 px-6 pb-7 pt-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/5">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>

          <AlertDialogHeader className="mt-6 text-center sm:text-center">
            <AlertDialogTitle className="text-xl font-bold tracking-tight">
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription className="mx-auto max-w-sm leading-6">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <AlertDialogFooter className="grid gap-2 bg-background p-6 sm:grid-cols-2 sm:space-x-0">
          {secondaryAction ? (
            <Button
              type="button"
              variant="outline"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.disabled}
              className="w-full gap-2"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          ) : null}
          <AlertDialogAction
            onClick={onConfirm}
            className={secondaryAction ? "w-full" : "w-full sm:col-span-2"}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
