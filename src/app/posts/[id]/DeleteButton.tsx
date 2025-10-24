"use client";

import { useFormState, useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { PostActionState } from "../actions";
import { AlertDialogComponent } from "@/components/formalert/alertdialog";

const initialState: PostActionState = { ok: true };

type DeleteButtonProps = {
  action: (state: PostActionState, formData: FormData) => Promise<PostActionState>;
  id: string;
};

export default function DeleteButton({ action, id }: DeleteButtonProps) {
  const [state, formAction] = useFormState(action, initialState);

  const formid = `delete-form-${id}`;

  return (
    <>
      <form id={formid} action={formAction}>
        <input type="hidden" name="id" value={id} />
        {!state.ok && state.message ? (
          <p className="text-sm text-destructive">{state.message}</p>
        ) : null}
      </form>
      <AlertDialogComponent
        showText="삭제"
        des="asdasd"
        title="sadasd"
        action={<DeleteSubmitButton />}
        formid={formid}
      />
    </>
  );
}

function DeleteSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="bg-red-700 hover:bg-re" type="submit" disabled={pending}>
      {pending ? "삭제 중..." : "삭제"}
    </Button>
  );
}
