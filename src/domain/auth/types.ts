export type AccountActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  field?: "newPassword";
};

export type AccountFormAction = (
  previousState: AccountActionState,
  formData: FormData
) => Promise<AccountActionState>;
