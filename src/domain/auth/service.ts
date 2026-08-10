import "server-only";

import { requireAuthContext } from "@/lib/auth/session";

import { PASSWORD_SECURITY_MESSAGE } from "./constants";
import * as repository from "./repository";
import { EmailChangeSchema, PasswordChangeSchema } from "./schema";

type AccountErrorCode =
  | "EMAIL_UNAVAILABLE"
  | "EMAIL_UNCHANGED"
  | "INVALID_CURRENT_PASSWORD"
  | "RATE_LIMITED"
  | "REAUTHENTICATION_REQUIRED"
  | "SAME_PASSWORD"
  | "SESSION_REQUIRED"
  | "SOCIAL_ACCOUNT"
  | "WEAK_PASSWORD";

export class AccountError extends Error {
  constructor(
    public readonly code: AccountErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AccountError";
  }
}

function getAuthErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object" || !("code" in error)) return undefined;
  return typeof error.code === "string" ? error.code : undefined;
}

function translateAuthError(error: unknown): never {
  const code = getAuthErrorCode(error);

  switch (code) {
    case "same_password":
      throw new AccountError("SAME_PASSWORD", "현재 비밀번호와 다른 비밀번호를 입력해 주세요.");
    case "reauthentication_not_valid":
    case "invalid_credentials":
    case "current_password_mismatch":
    case "current_password_required":
      throw new AccountError("INVALID_CURRENT_PASSWORD", "현재 비밀번호가 올바르지 않습니다.");
    case "weak_password":
      throw new AccountError("WEAK_PASSWORD", PASSWORD_SECURITY_MESSAGE);
    case "email_exists":
    case "user_already_exists":
      throw new AccountError(
        "EMAIL_UNAVAILABLE",
        "이미 사용 중인 이메일입니다. 다른 이메일을 입력해 주세요."
      );
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      throw new AccountError("RATE_LIMITED", "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
    case "reauthentication_needed":
    case "reauth_nonce_missing":
      throw new AccountError(
        "REAUTHENTICATION_REQUIRED",
        "보안을 위해 다시 로그인한 뒤 비밀번호를 변경해 주세요."
      );
    case "user_sso_managed":
      throw new AccountError(
        "SOCIAL_ACCOUNT",
        "소셜 로그인 계정의 비밀번호는 연결된 로그인 서비스에서 관리해 주세요."
      );
    case "session_not_found":
    case "session_expired":
      throw new AccountError("SESSION_REQUIRED", "로그인이 필요합니다.");
    default:
      throw error;
  }
}

async function requireAccountContext() {
  try {
    return await requireAuthContext();
  } catch (error) {
    if (error instanceof Error && error.message === "로그인이 필요합니다.") {
      throw new AccountError("SESSION_REQUIRED", "로그인이 필요합니다.");
    }
    throw error;
  }
}

export async function requestEmailChange(input: unknown, emailRedirectTo: string): Promise<void> {
  const parsed = EmailChangeSchema.parse(input);
  const { supabase, user } = await requireAccountContext();
  const currentEmail = user.email?.trim();

  if (!currentEmail) {
    throw new AccountError(
      "SOCIAL_ACCOUNT",
      "이메일이 연결되지 않은 계정입니다. 로그인 방식을 확인해 주세요."
    );
  }

  if (currentEmail.toLowerCase() === parsed.newEmail.toLowerCase()) {
    throw new AccountError("EMAIL_UNCHANGED", "현재 이메일과 다른 이메일을 입력해 주세요.");
  }

  try {
    const verifiedUserId = await repository.verifyCurrentPassword(
      supabase,
      currentEmail,
      parsed.currentPassword
    );
    if (verifiedUserId !== user.id) {
      throw new AccountError("INVALID_CURRENT_PASSWORD", "현재 비밀번호가 올바르지 않습니다.");
    }

    await repository.requestEmailChange(supabase, parsed.newEmail, emailRedirectTo);
  } catch (error) {
    if (error instanceof AccountError) throw error;
    translateAuthError(error);
  }
}

export async function changePassword(input: unknown): Promise<void> {
  const parsed = PasswordChangeSchema.parse(input);
  const { supabase } = await requireAccountContext();

  try {
    await repository.changePassword(supabase, parsed.currentPassword, parsed.newPassword);
  } catch (error) {
    translateAuthError(error);
  }
}
