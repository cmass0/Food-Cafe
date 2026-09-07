"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FormMode } from "./FormActionBar";

// 서버가 저장 성공을 반환한 뒤에만 호출합니다. Toaster는 루트에 있어 이동 후에도 유지됩니다.
export function useFormSuccess() {
  const router = useRouter();
  return (href: string, mode: FormMode) => {
    toast.success(mode === "edit" ? "수정되었습니다." : "등록되었습니다.");
    router.push(href);
  };
}
