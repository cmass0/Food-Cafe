"use server";

import { ZodError } from "zod";

import * as authService from "@/domain/auth/service";
import type { AccountActionState, PhoneOtpActionState } from "@/domain/auth/types";
import { buildAuthCallbackUrl } from "@/lib/auth/callback-url";

const DEFAULT_ERROR = "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";

function getTextValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getActionError(error: unknown): AccountActionState {
  if (error instanceof ZodError) {
    return {
      status: "error",
      message: error.issues[0]?.message ?? "입력 내용을 확인해 주세요.",
    };
  }

  if (error instanceof authService.AccountError) {
    const field =
      error.code === "WEAK_PASSWORD" || error.code === "SAME_PASSWORD" ? "newPassword" : undefined;
    return { status: "error", message: error.message, field };
  }

  console.error("계정 정보 변경 실패", error);
  return { status: "error", message: DEFAULT_ERROR };
}

function getPhoneActionError(
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

  console.error("휴대폰 번호 인증 실패", error);
  return {
    ...previousState,
    status: "error",
    message: DEFAULT_ERROR,
    phone: phone || previousState.phone,
  };
}

export async function requestEmailChangeAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await authService.requestEmailChange(
      {
        currentPassword: getTextValue(formData, "currentPassword"),
        newEmail: getTextValue(formData, "newEmail"),
      },
      await buildAuthCallbackUrl({ next: "/profile" })
    );

    return {
      status: "success",
      message: "새 이메일로 인증 메일을 보냈습니다. 메일함을 확인해 주세요.",
    };
  } catch (error) {
    return getActionError(error);
  }
}

export async function changePasswordAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  try {
    await authService.changePassword({
      currentPassword: getTextValue(formData, "currentPassword"),
      newPassword: getTextValue(formData, "newPassword"),
      confirmPassword: getTextValue(formData, "confirmPassword"),
    });

    return {
      status: "success",
      message: "비밀번호가 변경되었습니다.",
    };
  } catch (error) {
    return getActionError(error);
  }
}

export async function phoneRegistrationAction(
  previousState: PhoneOtpActionState,
  formData: FormData
): Promise<PhoneOtpActionState> {
  const intent = getTextValue(formData, "intent");
  const phone = getTextValue(formData, "phone");

  try {
    if (intent === "verify") {
      const verifiedPhone = await authService.verifyPhoneRegistration({
        phone,
        token: getTextValue(formData, "token"),
      });
      return {
        status: "success",
        step: "complete",
        message: "휴대폰 번호 인증이 완료되었습니다.",
        phone: verifiedPhone,
      };
    }

    const normalizedPhone = await authService.requestPhoneRegistration({ phone });
    return {
      status: "success",
      step: "otp",
      message: "입력한 휴대폰 번호로 인증번호를 보냈습니다.",
      phone: normalizedPhone,
    };
  } catch (error) {
    return getPhoneActionError(error, previousState, phone);
  }
}
