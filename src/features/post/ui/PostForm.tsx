"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { PostActionState } from "@/app/posts/actions";

type PostFormAction = (
  state: PostActionState,
  formData: FormData
) => Promise<PostActionState>;

type PostFormProps = {
  action: PostFormAction;
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

const initialState: PostActionState = { ok: true };

export default function PostForm({
  action,
  defaultValues,
  submitLabel = "등록",
  cancelHref,
}: PostFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form className="flex flex-col gap-4" action={formAction}>
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
        <span className="font-medium">내용</span>
        <textarea
          name="content"
          defaultValue={defaultValues?.content ?? ""}
          required
          rows={10}
          className="rounded border border-input bg-background px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium">구분</span>
        <input
          name="type"
          type="text"
          defaultValue={defaultValues?.type ?? "board"}
          maxLength={40}
          className="rounded border border-input bg-background px-3 py-2"
        />
      </label>
      {!state.ok && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        {cancelHref ? (
          <Link className="rounded border border-input px-3 py-2 text-sm" href={cancelHref}>
            취소
          </Link>
        ) : null}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

type SubmitButtonProps = {
  label: string;
};

function SubmitButton({ label }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "처리 중..." : label}
    </Button>
  );
}
