"use client";

import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  autoComplete: "current-password" | "new-password";
};

function PasswordField({ id, label, placeholder, autoComplete }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          minLength={6}
          required
          className="pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
          aria-label={`${label} ${visible ? "숨기기" : "보기"}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function EditPassword() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form
      className="grid gap-4 rounded-lg border border-zinc-200 bg-white p-4"
      onSubmit={handleSubmit}
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
        id="current-password"
        label="현재 비밀번호"
        placeholder="현재 비밀번호 입력"
        autoComplete="current-password"
      />
      <PasswordField
        id="account-new-password"
        label="새 비밀번호"
        placeholder="새 비밀번호 입력"
        autoComplete="new-password"
      />
      <PasswordField
        id="account-new-password-confirm"
        label="새 비밀번호 확인"
        placeholder="새 비밀번호 다시 입력"
        autoComplete="new-password"
      />

      <p className="text-xs leading-5 text-zinc-500">
        6자 이상이며 영문 대·소문자, 숫자, 특수문자를 포함해 주세요.
      </p>

      <Button type="submit" className="justify-self-end">
        비밀번호 변경
      </Button>
    </form>
  );
}
