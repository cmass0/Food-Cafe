export type AccountActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  field?: "newPassword";
};

export type AccountFormAction = (
  previousState: AccountActionState,
  formData: FormData
) => Promise<AccountActionState>;

export type RecoveryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  field?: "email" | "newPassword";
};

export type RecoveryFormAction = (
  previousState: RecoveryActionState,
  formData: FormData
) => Promise<RecoveryActionState>;
