import type { Metadata } from "next";

import PasswordRecoveryShell from "@/domain/auth/ui/PasswordRecoveryShell";
import PasswordUpdateForm from "@/domain/auth/ui/PasswordUpdateForm";

export const metadata: Metadata = {
  title: "새 비밀번호 설정 | FoodCafe",
  description: "FoodCafe 계정에서 사용할 새 비밀번호를 설정하세요.",
};

export default function UpdatePasswordPage() {
  return (
    <PasswordRecoveryShell
      step="update"
      title="새 비밀번호 설정"
      description={
        <>
          앞으로 사용할 새 비밀번호를 입력해 주세요.
          <br />
          안전한 비밀번호로 변경한 뒤 다시 로그인해 주세요.
        </>
      }
    >
      <PasswordUpdateForm />
    </PasswordRecoveryShell>
  );
}
