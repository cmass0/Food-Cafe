"use client";

import { LockKeyhole, Mail } from "lucide-react";
import { type FormEvent, useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AccountActionState, AccountFormAction } from "@/domain/auth/types";

import NewPasswordFields from "./NewPasswordFields";
import PasswordField from "./PasswordField";

type AccountSecurityFormProps = {
  currentEmail: string;
  emailAction: AccountFormAction;
  passwordAction: AccountFormAction;
};

const initialState: AccountActionState = { status: "idle" };

function FormMessage({
  state,
  clientError,
  pending,
}: {
  state: AccountActionState;
  clientError?: string;
  pending: boolean;
}) {
  if (pending) return null;

  const message = clientError || state.message;
  if (!message) return null;

  const isError = Boolean(clientError) || state.status === "error";
  return (
    <p
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "min-w-0 flex-1 text-sm text-destructive"
          : "min-w-0 flex-1 text-sm font-medium text-emerald-700"
      }
    >
      {message}
    </p>
  );
}

export default function AccountSecurityForm({
  currentEmail,
  emailAction,
  passwordAction,
}: AccountSecurityFormProps) {
  const [emailState, emailFormAction, emailPending] = useActionState(emailAction, initialState);
  const [passwordState, passwordFormAction, passwordPending] = useActionState(
    passwordAction,
    initialState
  );
  const [emailClientError, setEmailClientError] = useState("");
  const [passwordClientError, setPasswordClientError] = useState("");
  const emailFormRef = useRef<HTMLFormElement>(null);
  const passwordFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (emailState.status === "success") emailFormRef.current?.reset();
  }, [emailState.status]);

  useEffect(() => {
    if (passwordState.status === "success") passwordFormRef.current?.reset();
  }, [passwordState.status]);

  function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    setEmailClientError("");
    const formData = new FormData(event.currentTarget);
    const newEmail = formData.get("newEmail")?.toString().trim() ?? "";

    if (newEmail.toLowerCase() === currentEmail.trim().toLowerCase()) {
      event.preventDefault();
      setEmailClientError("현재 이메일과 다른 이메일을 입력해 주세요.");
    }
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    setPasswordClientError("");
    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get("newPassword")?.toString() ?? "";
    const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

    if (newPassword !== confirmPassword) {
      event.preventDefault();
      setPasswordClientError("새 비밀번호가 일치하지 않습니다.");
    }
  }

  return (
    <div className="grid gap-5">
      <form
        ref={emailFormRef}
        action={emailFormAction}
        onSubmit={handleEmailSubmit}
        className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
            <Mail className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">이메일 변경</h4>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              현재 비밀번호 확인 후 새 이메일로 인증 메일을 보냅니다.
            </p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="current-email">현재 이메일</Label>
          <Input
            id="current-email"
            type="email"
            value={currentEmail}
            readOnly
            className="bg-zinc-50 text-zinc-500"
          />
        </div>

        <PasswordField
          id="account-email-current-password"
          name="currentPassword"
          label="현재 비밀번호"
          placeholder="현재 비밀번호 입력"
          autoComplete="current-password"
          disabled={emailPending || !currentEmail}
        />

        <div className="grid gap-2">
          <Label htmlFor="new-email">새 이메일</Label>
          <Input
            id="new-email"
            name="newEmail"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="변경할 이메일을 입력하세요"
            disabled={emailPending || !currentEmail}
            required
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormMessage state={emailState} clientError={emailClientError} pending={emailPending} />
          <Button className="ml-auto" type="submit" disabled={emailPending || !currentEmail}>
            {emailPending ? "인증 메일 전송 중..." : "인증 메일 보내기"}
          </Button>
        </div>
      </form>

      <form
        ref={passwordFormRef}
        action={passwordFormAction}
        onSubmit={handlePasswordSubmit}
        className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-emerald-50 text-emerald-700">
            <LockKeyhole className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-zinc-900">비밀번호 변경</h4>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              현재 비밀번호를 확인한 뒤 새 비밀번호로 변경합니다.
            </p>
          </div>
        </div>

        <PasswordField
          id="account-current-password"
          name="currentPassword"
          label="현재 비밀번호"
          placeholder="현재 비밀번호 입력"
          autoComplete="current-password"
          disabled={passwordPending}
        />
        <NewPasswordFields
          idPrefix="account"
          disabled={passwordPending}
          newPasswordError={
            !passwordPending &&
            passwordState.status === "error" &&
            passwordState.field === "newPassword"
              ? passwordState.message
              : undefined
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormMessage
            state={passwordState.field === "newPassword" ? initialState : passwordState}
            clientError={passwordClientError}
            pending={passwordPending}
          />
          <Button className="ml-auto" type="submit" disabled={passwordPending}>
            {passwordPending ? "비밀번호 변경 중..." : "비밀번호 변경"}
          </Button>
        </div>
      </form>
    </div>
  );
}
