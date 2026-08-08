"use client";

import { Mail } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRow } from "@/domain/user/types";

type Props = {
  userProfile: UserRow;
};

export default function EditEmail({ userProfile }: Props) {
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
          <Mail className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <h4 className="text-sm font-semibold text-zinc-900">이메일 변경</h4>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            새 이메일 주소로 전송되는 인증을 완료하면 변경됩니다.
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="current-email">현재 이메일</Label>
        <Input
          id="current-email"
          type="email"
          value={userProfile.email ?? ""}
          readOnly
          className="bg-zinc-50 text-zinc-500"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="new-email">새 이메일</Label>
        <Input
          id="new-email"
          name="new-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="변경할 이메일을 입력하세요"
          required
        />
      </div>

      <Button type="submit" className="justify-self-end">
        인증 메일 보내기
      </Button>
    </form>
  );
}
