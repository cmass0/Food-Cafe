"use client";

import { useTransition } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

type PostFormProps = {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: {
    id?: string;
    title?: string;
    content?: string;
    type?: string;
    writerName?: string;
  };
  submitLabel?: string;
  cancelHref?: string;
};

export default function PostForm({ action, defaultValues, submitLabel = "저장", cancelHref }: PostFormProps) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-4"
      action={(formData) => startTransition(() => action(formData))}
    >
      {defaultValues?.id ? <input type="hidden" name="id" defaultValue={defaultValues.id} /> : null}
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">제목</span>
        <input
          name="title"
          type="text"
          defaultValue={defaultValues?.title ?? ""}
          required
          maxLength={150}
          className="rounded border border-input bg-background px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">작성자</span>
        <input
          name="writerName"
          type="text"
          defaultValue={defaultValues?.writerName ?? ""}
          required
          maxLength={120}
          placeholder="표시할 이름"
          className="rounded border border-input bg-background px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">본문</span>
        <textarea
          name="content"
          defaultValue={defaultValues?.content ?? ""}
          required
          rows={10}
          className="rounded border border-input bg-background px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">분류</span>
        <input
          name="type"
          type="text"
          defaultValue={defaultValues?.type ?? "board"}
          maxLength={40}
          className="rounded border border-input bg-background px-3 py-2"
        />
      </label>
      <div className="flex items-center justify-end gap-2">
        {cancelHref ? (
          <Link className="rounded border border-input px-3 py-2 text-sm" href={cancelHref}>
            취소
          </Link>
        ) : null}
        <Button type="submit" disabled={pending}>
          {pending ? "저장 중..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
