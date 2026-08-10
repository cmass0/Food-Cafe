"use server";

import { headers } from "next/headers";
import { ZodError } from "zod";

import * as authService from "@/domain/auth/service";
import type { AccountActionState } from "@/domain/auth/types";

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
    return { status: "error", message: error.message };
  }

  console.error("계정 정보 변경 실패", error);
  return { status: "error", message: DEFAULT_ERROR };
}

async function getCallbackUrl(): Promise<string> {
  const requestHeaders = await headers();
  const rawOrigin = requestHeaders.get("origin");

  if (!rawOrigin) {
    throw new Error("요청 출처를 확인할 수 없습니다.");
  }

  const origin = new URL(rawOrigin);
  if (origin.protocol !== "http:" && origin.protocol !== "https:") {
    throw new Error("유효하지 않은 요청 출처입니다.");
  }

  const callbackUrl = new URL("/auth/callback", origin.origin);
  callbackUrl.searchParams.set("next", "/profile");
  return callbackUrl.toString();
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
      await getCallbackUrl()
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
