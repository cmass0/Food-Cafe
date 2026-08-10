import type { Metadata } from "next";

import { requestPasswordResetAction } from "@/app/auth/recovery/actions";
import PasswordRecoveryShell from "@/domain/auth/ui/PasswordRecoveryShell";
import PasswordResetRequestForm from "@/domain/auth/ui/PasswordResetRequestForm";

export const metadata: Metadata = {
  title: "비밀번호 찾기 | FoodCafe",
  description: "가입한 이메일로 비밀번호 변경 링크를 받아보세요.",
};

type RecoveryPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const initialError =
    error === "invalid-link"
      ? "비밀번호 변경 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 받아 주세요."
      : undefined;

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
      <PasswordResetRequestForm action={requestPasswordResetAction} initialError={initialError} />
    </PasswordRecoveryShell>
  );
}
