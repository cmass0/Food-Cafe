"use client";

import { CheckCircle2, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PhoneOtpActionState, PhoneOtpFormAction } from "@/domain/auth/types";

const initialState: PhoneOtpActionState = { status: "idle", step: "phone" };
const RESEND_COOLDOWN_SECONDS = 60;

type PhoneRegistrationFormProps = {
  action: PhoneOtpFormAction;
  currentPhone?: string | null;
};

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^82/, "0");
  if (!/^010\d{8}$/.test(digits)) return "등록된 휴대폰 번호";
  return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
}

export default function PhoneRegistrationForm({
  action,
  currentPhone,
}: PhoneRegistrationFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialState);
  const [phone, setPhone] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (state.step === "complete" && state.status === "success") {
      router.refresh();
    }
  }, [router, state.status, state.step]);

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

  return (
    <div className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
          <Smartphone className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h4 className="text-sm font-semibold text-zinc-900">휴대폰 인증</h4>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            이메일 찾기에 사용할 본인 휴대폰 번호를 인증합니다.
          </p>
          {currentPhone ? (
            <p className="mt-1 text-xs font-semibold text-emerald-700">
              인증된 번호 {maskPhone(currentPhone)}
            </p>
          ) : null}
        </div>
      </div>

      {state.step === "complete" ? (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          {state.message}
        </div>
      ) : state.step === "otp" ? (
        <div className="grid gap-3">
          {state.status === "success" ? (
            <p className="rounded-md bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
              {state.message}
            </p>
          ) : null}
          <form action={formAction} className="grid gap-3">
            <input type="hidden" name="phone" value={state.phone ?? phone} />
            <div className="grid gap-2">
              <Label htmlFor="account-phone-token">인증번호</Label>
              <Input
                id="account-phone-token"
                name="token"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="6자리 인증번호"
                required
                disabled={pending}
                aria-invalid={state.field === "token" ? true : undefined}
              />
              {state.status === "error" ? (
                <p role="alert" className="text-sm text-destructive">
                  {state.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" name="intent" value="verify" disabled={pending}>
              {pending ? "인증번호 확인 중..." : "휴대폰 번호 인증"}
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
              className="h-auto w-full py-1.5 text-xs text-zinc-500"
            >
              {resendCooldown > 0
                ? `인증번호 다시 받기 (${resendCooldown}초)`
                : "인증번호 다시 받기"}
            </Button>
          </form>
        </div>
      ) : (
        <form action={formAction} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="account-phone">휴대폰 번호</Label>
            <Input
              id="account-phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="010-1234-5678"
              required
              disabled={pending}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-invalid={state.field === "phone" ? true : undefined}
            />
            {state.status === "error" ? (
              <p role="alert" className="text-sm text-destructive">
                {state.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" name="intent" value="request" disabled={pending}>
            {pending ? "인증번호 전송 중..." : currentPhone ? "새 번호 인증" : "인증번호 받기"}
          </Button>
        </form>
      )}
    </div>
  );
}
