"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserRow } from "@/domain/user/types";
import { getBrowserSupabase } from "@/lib/supabase";

import { updateProfileAction } from "../../actions";

type Props = {
  userProfile: UserRow;
};

export default function EditName({ userProfile }: Props) {
  const [displayName, setDisplayName] = useState(userProfile.display_name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const supabase = getBrowserSupabase();

  const handleNameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameError(null);
    setNameSuccess(null);

    const nextName = displayName.trim();
    if (!nextName) {
      setNameError("이름을 입력해주세요.");
      return;
    }

    try {
      setNameSaving(true);
      const formData = new FormData();
      formData.set("display_name", nextName);
      await updateProfileAction(formData);
      await supabase.auth.updateUser({
        data: {
          full_name: nextName,
          name: nextName,
          nickname: nextName,
        },
      });
      setNameSuccess("이름이 변경되었습니다.");
    } catch (error) {
      console.error("이름 변경에 실패했습니다.", error);
      setNameError("이름 변경에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <form onSubmit={handleNameSubmit} className="grid gap-2">
      <Label htmlFor="display_name">이름</Label>
      <Input
        id="display_name"
        name="display_name"
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="변경할 이름을 입력하세요"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {nameError ? (
          <p className="text-sm text-red-500">{nameError}</p>
        ) : nameSuccess ? (
          <p className="text-sm font-bold">{nameSuccess}</p>
        ) : (
          <div />
        )}
        <Button type="submit" disabled={nameSaving}>
          {nameSaving ? "이름 변경 중..." : "이름 변경"}
        </Button>
      </div>
    </form>
  );
}
