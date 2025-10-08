"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/app/profile/actions";

interface ProfileFormProps {
  defaultName: string | null;
  defaultAvatar: string | null;
}

export default function ProfileForm({ defaultName, defaultAvatar }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      updateProfileAction(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium">닉네임</label>
        <input name="display_name" defaultValue={defaultName ?? ""} className="rounded border px-3 py-2" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium">아바타 이미지 URL</label>
        <input name="photo_url" defaultValue={defaultAvatar ?? ""} className="rounded border px-3 py-2" />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "저장 중..." : "변경 저장"}
      </Button>
    </form>
  );
}