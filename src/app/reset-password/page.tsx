import type { Metadata } from "next";

import PasswordRecoveryShell from "@/domain/auth/ui/PasswordRecoveryShell";
import PasswordResetRequestForm from "@/domain/auth/ui/PasswordResetRequestForm";

export const metadata: Metadata = {
  title: "비밀번호 찾기 | FoodCafe",
  description: "가입한 이메일로 비밀번호 변경 링크를 받아보세요.",
};

export default function ResetPasswordPage() {
  return (
    <PasswordRecoveryShell
      step="request"
      title="비밀번호 찾기"
      description={
        <>
          가입한 이메일을 입력해 주세요.
          <br />
          이메일로 비밀번호 변경 링크를 보내드릴게요.
        </>
      }
    >
      <PasswordResetRequestForm />
    </PasswordRecoveryShell>
  );
}
