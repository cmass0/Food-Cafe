"use client";

import { Eye, EyeOff } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PasswordFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  visible: boolean;
  onVisibilityChange: () => void;
};

function PasswordField({
  id,
  label,
  placeholder,
  visible,
  onVisibilityChange,
}: PasswordFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-semibold text-zinc-700">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          minLength={6}
          required
          className="h-12 rounded-lg border-zinc-300 bg-white px-4 pr-12 text-base shadow-none placeholder:text-zinc-400 focus-visible:border-[#438e4d] focus-visible:ring-[#438e4d]/20 md:text-sm"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#438e4d]/30"
          onClick={onVisibilityChange}
          aria-label={`${label} ${visible ? "숨기기" : "보기"}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export default function PasswordUpdateForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <PasswordField
        id="new-password"
        label="새 비밀번호"
        placeholder="새 비밀번호 입력"
        visible={showPassword}
        onVisibilityChange={() => setShowPassword((visible) => !visible)}
      />
      <PasswordField
        id="new-password-confirm"
        label="새 비밀번호 확인"
        placeholder="새 비밀번호 다시 입력"
        visible={showPasswordConfirm}
        onVisibilityChange={() => setShowPasswordConfirm((visible) => !visible)}
      />
      <p className="text-xs leading-5 text-zinc-500">
        6자 이상이며 영문 대·소문자, 숫자, 특수문자를 포함해 주세요.
      </p>
      <Button
        type="submit"
        className="mt-1 h-12 rounded-lg bg-[#438e4d] text-base font-bold text-white hover:bg-[#34783f]"
      >
        비밀번호 변경하기
      </Button>
    </form>
  );
}
