import { z } from "zod";

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

export type EmailChangeInput = z.infer<typeof EmailChangeSchema>;
export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetCompleteInput = z.infer<typeof PasswordResetCompleteSchema>;
