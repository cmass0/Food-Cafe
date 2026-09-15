"use client";

import { CheckCircle2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PhoneOtpActionState, PhoneOtpFormAction } from "@/domain/auth/types";
import { buildAuthModalPath } from "@/lib/auth/return-to";

const initialState: PhoneOtpActionState = { status: "idle", step: "phone" };
const RESEND_COOLDOWN_SECONDS = 60;

type EmailRecoveryFormProps = {
  action: PhoneOtpFormAction;
};

export default function EmailRecoveryForm({ action }: EmailRecoveryFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [phone, setPhone] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (state.step !== "otp" || state.status !== "success") return;
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
  }, [state.phone, state.status, state.step]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  if (state.step === "complete" && state.maskedEmail) {
    return (
      <div className="grid gap-5 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm text-zinc-500">가입된 이메일을 찾았습니다.</p>
          <p className="mt-2 break-all text-xl font-black text-zinc-950">{state.maskedEmail}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button asChild className="h-11 bg-[#34783f] hover:bg-[#2f6f39]">
            <Link href={buildAuthModalPath("/")}>로그인하기</Link>
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/auth/recovery?tab=password">비밀번호 찾기</Link>
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="text-zinc-500"
          onClick={() => window.location.reload()}
        >
          다른 번호로 찾기
        </Button>
      </div>
    );
  }

  if (state.step === "otp") {
    const tokenError = state.field === "token" ? state.message : undefined;
    const generalError = state.status === "error" && !tokenError ? state.message : undefined;

    return (
      <div className="grid gap-4">
        <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
          <MailCheck className="mr-2 inline h-4 w-4" aria-hidden="true" />
          {state.status === "success" ? state.message : "문자로 받은 인증번호를 입력해 주세요."}
        </div>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="phone" value={state.phone ?? phone} />
          <div className="grid gap-2">
            <Label htmlFor="email-recovery-token" className="sr-only">
              인증번호
            </Label>
            <Input
              id="email-recovery-token"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="6자리 인증번호"
              required
              disabled={pending}
              aria-invalid={tokenError ? true : undefined}
              aria-describedby={tokenError ? "email-recovery-token-error" : undefined}
              className="h-12 text-center text-lg tracking-[0.35em]"
            />
            {tokenError ? (
              <p id="email-recovery-token-error" role="alert" className="text-sm text-destructive">
                {tokenError}
              </p>
            ) : null}
          </div>
          {generalError ? (
            <p role="alert" className="text-sm text-destructive">
              {generalError}
            </p>
          ) : null}
          <Button
            type="submit"
            name="intent"
            value="verify"
            disabled={pending}
            className="h-12 bg-[#34783f] text-base font-bold hover:bg-[#2f6f39]"
          >
            {pending ? "인증번호 확인 중..." : "인증하고 이메일 찾기"}
          </Button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="phone" value={state.phone ?? phone} />
          <Button
            type="submit"
            name="intent"
            value="request"
            variant="ghost"
            disabled={pending || resendCooldown > 0}
            className="h-auto w-full py-2 text-sm font-semibold text-zinc-500 hover:bg-transparent hover:text-[#34783f]"
          >
            {resendCooldown > 0 ? `인증번호 다시 받기 (${resendCooldown}초)` : "인증번호 다시 받기"}
          </Button>
        </form>
      </div>
    );
  }

  const phoneError = state.field === "phone" ? state.message : undefined;

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email-recovery-phone" className="sr-only">
          휴대폰 번호
        </Label>
        <Input
          id="email-recovery-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="010-1234-5678"
          required
          disabled={pending}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          aria-invalid={phoneError ? true : undefined}
          aria-describedby={phoneError ? "email-recovery-phone-error" : undefined}
          className="h-12 rounded-lg border-zinc-300 bg-white px-4 text-base shadow-none"
        />
        {phoneError ? (
          <p id="email-recovery-phone-error" role="alert" className="text-sm text-destructive">
            {phoneError}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        name="intent"
        value="request"
        disabled={pending}
        className="h-12 bg-[#34783f] text-base font-bold hover:bg-[#2f6f39]"
      >
        {pending ? "인증번호 전송 중..." : "인증번호 받기"}
      </Button>
      <p className="text-center text-xs leading-5 text-zinc-500">
        휴대폰 인증을 완료한 계정만 이메일을 찾을 수 있습니다.
      </p>
    </form>
  );
}
