"use client";

import { updateProfileAction } from "@/app/profile/actions";

interface ProfileFormProps {
  defaultName: string | null;
  defaultAvatar: string | null;
}

export default function ProfileForm({ defaultName, defaultAvatar }: ProfileFormProps) {
  return (
    <form action={updateProfileAction} className="grid max-w-md gap-3">
      <label className="grid gap-1">
        <span>이름</span>
        <input name="display_name" defaultValue={defaultName ?? ""} className="rounded border px-3 py-2" />
      </label>
      <label className="grid gap-1">
        <span>아바타 URL</span>
        <input name="avatar_url" defaultValue={defaultAvatar ?? ""} className="rounded border px-3 py-2" />
      </label>
      <button type="submit" className="rounded bg-primary px-4 py-2 font-medium text-primary-foreground">
        저장
      </button>
    </form>
  );
}

