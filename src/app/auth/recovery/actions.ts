"use server";

import { redirect } from "next/navigation";
import { ZodError } from "zod";

import * as authService from "@/domain/auth/service";
import type { PhoneOtpActionState, RecoveryActionState } from "@/domain/auth/types";
import { buildAuthCallbackUrl } from "@/lib/auth/callback-url";

const DEFAULT_ERROR = "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";
const REQUEST_SUCCESS = "입력한 이메일로 가입된 계정이 있다면 비밀번호 변경 링크를 보내드렸습니다.";

function getTextValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getRecoveryActionError(error: unknown): RecoveryActionState {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path[0] === "email" ? "email" : undefined;
    return {
      status: "error",
      message: issue?.message ?? "입력 내용을 확인해 주세요.",
      field,
    };
  }

  if (error instanceof authService.AccountError) {
    const field =
      error.code === "WEAK_PASSWORD" || error.code === "SAME_PASSWORD" ? "newPassword" : undefined;
    return { status: "error", message: error.message, field };
  }

  console.error("비밀번호 복구 처리 실패", error);
  return { status: "error", message: DEFAULT_ERROR };
}

function getEmailRecoveryActionError(
  error: unknown,
  previousState: PhoneOtpActionState,
  phone: string
): PhoneOtpActionState {
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path[0] === "token" ? "token" : "phone";
    return {
      ...previousState,
      status: "error",
      step: field === "token" ? "otp" : "phone",
      message: issue?.message ?? "입력 내용을 확인해 주세요.",
      field,
      phone: phone || previousState.phone,
    };
  }

  if (error instanceof authService.AccountError) {
    const field = error.code === "INVALID_PHONE_OTP" ? "token" : "phone";
    return {
      ...previousState,
      status: "error",
      step: field === "token" ? "otp" : previousState.step,
      message: error.message,
      field,
      phone: phone || previousState.phone,
    };
  }

  console.error("이메일 찾기 휴대폰 인증 실패", error);
  return {
    ...previousState,
    status: "error",
    message: DEFAULT_ERROR,
    phone: phone || previousState.phone,
  };
}

export async function requestPasswordResetAction(
  _previousState: RecoveryActionState,
  formData: FormData
): Promise<RecoveryActionState> {
  try {
    await authService.requestPasswordReset(
      { email: getTextValue(formData, "email") },
      await buildAuthCallbackUrl({ next: "/auth/recovery/reset", flow: "recovery" })
    );

    return { status: "success", message: REQUEST_SUCCESS };
  } catch (error) {
    return getRecoveryActionError(error);
  }
}

export async function completePasswordResetAction(
  _previousState: RecoveryActionState,
  formData: FormData
): Promise<RecoveryActionState> {
  try {
    await authService.completePasswordReset({
      newPassword: getTextValue(formData, "newPassword"),
      confirmPassword: getTextValue(formData, "confirmPassword"),
    });
  } catch (error) {
    return getRecoveryActionError(error);
  }

  redirect("/?auth=login&next=%2F&notice=password-reset");
}

export async function recoverEmailByPhoneAction(
  previousState: PhoneOtpActionState,
  formData: FormData
): Promise<PhoneOtpActionState> {
  const intent = getTextValue(formData, "intent");
  const phone = getTextValue(formData, "phone");

  try {
    if (intent === "verify") {
      const maskedEmail = await authService.verifyEmailRecoveryOtp({
        phone,
        token: getTextValue(formData, "token"),
      });
      return {
        status: "success",
        step: "complete",
        message: "휴대폰 인증이 완료되었습니다.",
        phone,
        maskedEmail,
      };
    }

    const normalizedPhone = await authService.requestEmailRecoveryOtp({ phone });
    return {
      status: "success",
      step: "otp",
      message: "입력한 번호와 연결된 계정이 있다면 인증번호를 보냈습니다. 문자를 확인해 주세요.",
      phone: normalizedPhone,
    };
  } catch (error) {
    return getEmailRecoveryActionError(error, previousState, phone);
  }
}
