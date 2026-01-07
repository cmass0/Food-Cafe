"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRow } from "@/domain/user/types";
import { getBrowserSupabase } from "@/lib/supabase";

type Props = {
  userProfile: UserRow;
};

export default function EditEmail({ userProfile }: Props) {
  const [email, setEmail] = useState(userProfile.email || "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const supabase = getBrowserSupabase();

  const sendmailHandler = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const { data, error } = await supabase.auth.updateUser(
      { email },
      {
        emailRedirectTo: `${process.env.BASE_URL}/auth/callback?next=/profile/${userProfile.id}?email=changed`,
      }
    );
    if (error) {
      console.error("인증 메일 발송에 실패했습니다.", error);
      setErrorMessage("인증 메일 발송에 실패했습니다. 다시 시도해주세요.");
      return;
    }
    console.log("인증 메일이 발송되었습니다.", data);
    setSuccessMessage("인증 메일이 발송되었습니다.");
  };

  return (
    <div className="grid gap-2">
      <Label htmlFor="email">이메일</Label>
      <Input
        id="email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="변경할 이메일을 입력하세요"
      />
      <div className="flex flex-wrap items-center">
        {errorMessage ? (
          <p className="text-sm text-red-500">{errorMessage}</p>
        ) : successMessage ? (
          <p className="text-sm font-bold">{successMessage}</p>
        ) : null}
      </div>
      <Button type="button" onClick={sendmailHandler}>
        인증 메일 보내기
      </Button>

      {!errorMessage && !successMessage ? (
        <p className="text-xs text-muted-foreground">이메일 변경 시 인증 메일이 발송됩니다.</p>
      ) : null}
    </div>
  );
}
