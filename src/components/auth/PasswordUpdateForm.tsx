"use client";

import { type FormEvent, useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import type { RecoveryActionState, RecoveryFormAction } from "@/domain/auth/types";

import NewPasswordFields from "./NewPasswordFields";

const initialState: RecoveryActionState = { status: "idle" };

type PasswordUpdateFormProps = {
  action: RecoveryFormAction;
};

export default function PasswordUpdateForm({ action }: PasswordUpdateFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [clientError, setClientError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    setClientError("");
    const formData = new FormData(event.currentTarget);
    const newPassword = formData.get("newPassword")?.toString() ?? "";
    const confirmPassword = formData.get("confirmPassword")?.toString() ?? "";

    if (newPassword !== confirmPassword) {
      event.preventDefault();
      setClientError("새 비밀번호가 일치하지 않습니다.");
    }
  }

  const newPasswordError =
    !pending && state.status === "error" && state.field === "newPassword"
      ? state.message
      : undefined;
  const formError = clientError || (!pending && !state.field ? state.message : undefined);

  return (
    <form className="grid gap-4" action={formAction} onSubmit={handleSubmit}>
      <NewPasswordFields
        idPrefix="recovery"
        disabled={pending}
        newPasswordError={newPasswordError}
      />
      {formError ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="mt-1 h-12 rounded-lg bg-[#34783f] text-base font-bold text-white hover:bg-[#2f6f39]"
      >
        {pending ? "비밀번호 변경 중..." : "비밀번호 변경하기"}
      </Button>
    </form>
  );
}
