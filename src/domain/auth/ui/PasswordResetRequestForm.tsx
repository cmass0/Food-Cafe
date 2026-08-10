"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecoveryActionState, RecoveryFormAction } from "@/domain/auth/types";

const initialState: RecoveryActionState = { status: "idle" };
const RESEND_COOLDOWN_SECONDS = 60;

type PasswordResetRequestFormProps = {
  action: RecoveryFormAction;
  initialError?: string;
};

export default function PasswordResetRequestForm({
  action,
  initialError,
}: PasswordResetRequestFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [email, setEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const hasSent = state.status === "success";
  const message = pending ? undefined : (state.message ?? initialError);
  const isError = state.status === "error" || (state.status === "idle" && Boolean(initialError));
  const emailError = !pending && state.field === "email" ? state.message : undefined;

  useEffect(() => {
    if (!hasSent) return;

    setCanResend(false);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    const readyTimer = window.setTimeout(() => {
      window.clearInterval(timer);
      setResendCooldown(0);
      setCanResend(true);
    }, RESEND_COOLDOWN_SECONDS * 1000);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(readyTimer);
    };
  }, [hasSent, state]);

  return (
    <form className="grid gap-4" action={formAction}>
      <div className="grid gap-2">
        <Label htmlFor="recovery-email" className="sr-only">
          가입한 이메일
        </Label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="가입한 이메일 입력"
          required
          disabled={pending}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "recovery-email-error" : undefined}
          className="h-12 rounded-lg border-zinc-300 bg-white px-4 text-base shadow-none placeholder:text-zinc-400 focus-visible:border-[#438e4d] focus-visible:ring-[#438e4d]/20 md:text-sm"
        />
        {emailError ? (
          <p id="recovery-email-error" role="alert" className="text-sm text-destructive">
            {emailError}
          </p>
        ) : null}
      </div>
      {message && !emailError ? (
        <p
          role={isError ? "alert" : "status"}
          className={
            isError
              ? "text-sm text-destructive"
              : "rounded-lg bg-emerald-50 px-3 py-2.5 text-sm leading-6 text-emerald-800"
          }
        >
          {message}
        </p>
      ) : null}
      <Button
        type={hasSent ? "button" : "submit"}
        disabled={pending || hasSent}
        className="h-12 rounded-lg bg-[#438e4d] text-base font-bold text-white hover:bg-[#34783f]"
      >
        {hasSent ? "변경 링크 전송 완료" : pending ? "변경 링크 전송 중..." : "변경 링크 전송하기"}
      </Button>
      {hasSent ? (
        <Button
          type="submit"
          variant="ghost"
          disabled={pending || !canResend}
          className="-mt-2 h-auto py-2 text-sm font-semibold text-zinc-500 hover:bg-transparent hover:text-[#438e4d]"
        >
          {pending
            ? "다시 전송 중..."
            : canResend
              ? "다시 전송하기"
              : `다시 전송하기 (${resendCooldown || RESEND_COOLDOWN_SECONDS}초)`}
        </Button>
      ) : null}
    </form>
  );
}
