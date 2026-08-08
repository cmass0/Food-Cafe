"use client";

import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordResetRequestForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
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
          className="h-12 rounded-lg border-zinc-300 bg-white px-4 text-base shadow-none placeholder:text-zinc-400 focus-visible:border-[#438e4d] focus-visible:ring-[#438e4d]/20 md:text-sm"
        />
      </div>
      <Button
        type="submit"
        className="h-12 rounded-lg bg-[#438e4d] text-base font-bold text-white hover:bg-[#34783f]"
      >
        변경 링크 전송하기
      </Button>
    </form>
  );
}
