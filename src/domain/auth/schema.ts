import { z } from "zod";

function normalizeKoreanMobilePhone(value: string): string {
  const compact = value.trim().replace(/[\s()-]/g, "");

  if (compact.startsWith("+82")) {
    return `+82${compact.slice(3).replace(/^0/, "")}`;
  }

  const digits = compact.replace(/\D/g, "");
  if (digits.startsWith("82")) {
    return `+82${digits.slice(2).replace(/^0/, "")}`;
  }
  if (digits.startsWith("0")) {
    return `+82${digits.slice(1)}`;
  }

  return compact;
}

const newPasswordFields = {
  newPassword: z.string().min(1, "새 비밀번호를 입력해 주세요."),
  confirmPassword: z.string().min(1, "새 비밀번호 확인을 입력해 주세요."),
};

function validatePasswordConfirmation(
  value: { newPassword: string; confirmPassword: string },
  context: z.RefinementCtx
) {
  if (value.newPassword !== value.confirmPassword) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confirmPassword"],
      message: "새 비밀번호가 일치하지 않습니다.",
    });
  }
}

export const EmailChangeSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
  newEmail: z
    .string()
    .trim()
    .min(1, "새 이메일을 입력해 주세요.")
    .email("올바른 이메일 주소를 입력해 주세요."),
});

export const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해 주세요."),
    ...newPasswordFields,
  })
  .superRefine(validatePasswordConfirmation);

export const PasswordResetRequestSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "가입한 이메일을 입력해 주세요.")
    .email("올바른 이메일 주소를 입력해 주세요."),
});

export const PasswordResetCompleteSchema = z
  .object(newPasswordFields)
  .superRefine(validatePasswordConfirmation);

export const KoreanMobilePhoneSchema = z
  .string()
  .trim()
  .min(1, "휴대폰 번호를 입력해 주세요.")
  .transform(normalizeKoreanMobilePhone)
  .refine((value) => /^\+8210\d{8}$/.test(value), {
    message: "010으로 시작하는 올바른 휴대폰 번호를 입력해 주세요.",
  });

export const PhoneOtpRequestSchema = z.object({
  phone: KoreanMobilePhoneSchema,
});

export const PhoneOtpVerifySchema = z.object({
  phone: KoreanMobilePhoneSchema,
  token: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "문자로 받은 6자리 인증번호를 입력해 주세요."),
});

export type EmailChangeInput = z.infer<typeof EmailChangeSchema>;
export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetCompleteInput = z.infer<typeof PasswordResetCompleteSchema>;
export type PhoneOtpRequestInput = z.infer<typeof PhoneOtpRequestSchema>;
export type PhoneOtpVerifyInput = z.infer<typeof PhoneOtpVerifySchema>;
