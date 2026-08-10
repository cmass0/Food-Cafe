export type AccountActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type AccountFormAction = (
  previousState: AccountActionState,
  formData: FormData
) => Promise<AccountActionState>;
