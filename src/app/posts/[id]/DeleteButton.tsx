"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { PostActionState } from "../actions";

const initialState: PostActionState = { ok: true };

type DeleteButtonProps = {
  action: (state: PostActionState, formData: FormData) => Promise<PostActionState>;
  id: string;
};

export default function DeleteButton({ action, id }: DeleteButtonProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col items-end gap-2 border-t border-border pt-4"
    >
      <input type="hidden" name="id" value={id} />
      {!state.ok && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
      <DeleteSubmitButton />
    </form>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      {pending ? "삭제 중..." : "삭제"}
    </Button>
  );
}
