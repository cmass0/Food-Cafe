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

export type PhoneOtpActionState = {
  status: "idle" | "success" | "error";
  step: "phone" | "otp" | "complete";
  message?: string;
  field?: "phone" | "token";
  phone?: string;
  maskedEmail?: string;
};

export type PhoneOtpFormAction = (
  previousState: PhoneOtpActionState,
  formData: FormData
) => Promise<PhoneOtpActionState>;
