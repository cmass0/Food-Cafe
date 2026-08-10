"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecoveryActionState, RecoveryFormAction } from "@/domain/auth/types";

const initialState: RecoveryActionState = { status: "idle" };

type PasswordResetRequestFormProps = {
  action: RecoveryFormAction;
  initialError?: string;
};

export default function PasswordResetRequestForm({
  action,
  initialError,
}: PasswordResetRequestFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const message = pending ? undefined : (state.message ?? initialError);
  const isError = state.status === "error" || (state.status === "idle" && Boolean(initialError));
  const emailError = !pending && state.field === "email" ? state.message : undefined;

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
        type="submit"
        disabled={pending}
        className="h-12 rounded-lg bg-[#438e4d] text-base font-bold text-white hover:bg-[#34783f]"
      >
        {pending ? "변경 링크 전송 중..." : "변경 링크 전송하기"}
      </Button>
    </form>
  );
}
