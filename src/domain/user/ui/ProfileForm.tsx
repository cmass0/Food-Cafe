"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/app/profile/actions";

interface ProfileFormProps {
  defaultName: string | null;
  defaultAvatar: string | null;
  defaultEmail: string | null;
}

export default function ProfileForm({ defaultName, defaultAvatar, defaultEmail }: ProfileFormProps) {
  const [isPending, startTransition] = React.useTransition();

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
        <label className="text-sm font-medium" htmlFor="display_name">
          이름
        </label>
        <input
          id="display_name"
          name="display_name"
          defaultValue={defaultName ?? ""}
          className="rounded border px-3 py-2"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="photo_url">
          아바타 이미지 URL
        </label>
        <input
          id="photo_url"
          name="photo_url"
          defaultValue={defaultAvatar ?? ""}
          className="rounded border px-3 py-2"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="email">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail ?? ""}
          className="rounded border px-3 py-2"
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? "저장 중..." : "저장하기"}
      </Button>
    </form>
  );
}