import type { Metadata } from "next";

import { recoverEmailByPhoneAction, requestPasswordResetAction } from "@/app/auth/recovery/actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailRecoveryForm from "@/domain/auth/ui/EmailRecoveryForm";
import PasswordRecoveryShell from "@/domain/auth/ui/PasswordRecoveryShell";
import PasswordResetRequestForm from "@/domain/auth/ui/PasswordResetRequestForm";

export const metadata: Metadata = {
  title: "이메일·비밀번호 찾기 | FoodCafe",
  description: "휴대폰 인증으로 이메일을 확인하거나 비밀번호 변경 링크를 받아보세요.",
};

type RecoveryPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    tab?: string | string[];
  }>;
};

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const tab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const defaultTab = tab === "email" ? "email" : "password";
  const initialError =
    error === "invalid-link"
      ? "비밀번호 변경 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 받아 주세요."
      : undefined;

  return (
    <PasswordRecoveryShell
      step="request"
      title="계정 찾기"
      description={
        <>
          이메일을 찾거나 비밀번호 변경 링크를 받아보세요.
          <br />
          필요한 방법을 선택해 안전하게 계정을 복구할 수 있어요.
        </>
      }
    >
      <Tabs key={defaultTab} defaultValue={defaultTab} className="w-full">
        <TabsList className="grid h-11 w-full grid-cols-2 bg-zinc-100">
          <TabsTrigger value="email" className="h-9">
            이메일 찾기
          </TabsTrigger>
          <TabsTrigger value="password" className="h-9">
            비밀번호 찾기
          </TabsTrigger>
        </TabsList>
        <TabsContent value="email" className="mt-6">
          <EmailRecoveryForm action={recoverEmailByPhoneAction} />
        </TabsContent>
        <TabsContent value="password" className="mt-6">
          <PasswordResetRequestForm
            action={requestPasswordResetAction}
            initialError={initialError}
          />
        </TabsContent>
      </Tabs>
    </PasswordRecoveryShell>
  );
}
