import "server-only";

import { cookies } from "next/headers";

import { isAuthSessionMissingError } from "@/lib/errors/supabase";
import {
  clearPasswordRecoveryCookie,
  matchesPasswordRecoveryMarker,
  PASSWORD_RECOVERY_COOKIE,
} from "@/lib/auth/recovery-session";
import { requireAuthContext } from "@/lib/auth/session";
import { getServerSupabase } from "@/lib/supabase/server";

import { PASSWORD_SECURITY_MESSAGE } from "./constants";
import * as repository from "./repository";
import {
  EmailChangeSchema,
  PasswordChangeSchema,
  PasswordResetCompleteSchema,
  PasswordResetRequestSchema,
  PhoneOtpRequestSchema,
  PhoneOtpVerifySchema,
} from "./schema";

type AccountErrorCode =
  | "EMAIL_UNAVAILABLE"
  | "EMAIL_UNCHANGED"
  | "INVALID_CURRENT_PASSWORD"
  | "INVALID_PHONE_OTP"
  | "PHONE_UNAVAILABLE"
  | "RATE_LIMITED"
  | "RECOVERY_EMAIL_NOT_FOUND"
  | "RECOVERY_SESSION_REQUIRED"
  | "REAUTHENTICATION_REQUIRED"
  | "SAME_PASSWORD"
  | "SESSION_REQUIRED"
  | "SMS_UNAVAILABLE"
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
    case "otp_expired":
    case "flow_state_expired":
    case "bad_code_verifier":
      throw new AccountError(
        "RECOVERY_SESSION_REQUIRED",
        "비밀번호 변경 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 받아 주세요."
      );
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

function isMissingAccountError(error: unknown): boolean {
  const code = getAuthErrorCode(error);
  return code === "user_not_found" || code === "email_not_found";
}

function isMissingPhoneAccountError(error: unknown): boolean {
  const code = getAuthErrorCode(error);
  return code === "user_not_found" || code === "invalid_credentials";
}

function translatePhoneAuthError(error: unknown): never {
  const code = getAuthErrorCode(error);

  switch (code) {
    case "phone_exists":
    case "user_already_exists":
    case "identity_already_exists":
      throw new AccountError(
        "PHONE_UNAVAILABLE",
        "이미 다른 계정에서 사용 중인 휴대폰 번호입니다."
      );
    case "otp_expired":
    case "invalid_credentials":
      throw new AccountError(
        "INVALID_PHONE_OTP",
        "인증번호가 올바르지 않거나 만료되었습니다. 새 인증번호를 받아 주세요."
      );
    case "over_sms_send_rate_limit":
    case "over_request_rate_limit":
      throw new AccountError(
        "RATE_LIMITED",
        "인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
      );
    case "phone_provider_disabled":
    case "otp_disabled":
    case "sms_send_failed":
      throw new AccountError(
        "SMS_UNAVAILABLE",
        "문자 인증 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요."
      );
    case "session_not_found":
    case "session_expired":
      throw new AccountError("SESSION_REQUIRED", "로그인이 필요합니다.");
    default:
      throw error;
  }
}

function maskEmail(email: string): string {
  const separator = email.lastIndexOf("@");
  if (separator <= 0 || separator === email.length - 1) {
    throw new AccountError(
      "RECOVERY_EMAIL_NOT_FOUND",
      "이 휴대폰 번호로 찾을 수 있는 이메일 계정이 없습니다."
    );
  }

  const localPart = email.slice(0, separator);
  const domain = email.slice(separator + 1);
  const visibleLength = localPart.length <= 2 ? 1 : 2;
  const visible = localPart.slice(0, visibleLength);
  const maskedLength = Math.max(localPart.length - visibleLength, 1);

  return `${visible}${"*".repeat(maskedLength)}@${domain}`;
}

export async function requestPasswordReset(input: unknown, redirectTo: string): Promise<void> {
  const parsed = PasswordResetRequestSchema.parse(input);
  const supabase = await getServerSupabase();

  try {
    await repository.sendPasswordResetEmail(supabase, parsed.email, redirectTo);
  } catch (error) {
    // 가입 여부가 외부에 노출되지 않도록 존재하지 않는 이메일도 성공 응답으로 통일한다.
    if (isMissingAccountError(error)) return;
    translateAuthError(error);
  }
}

export async function hasPasswordRecoverySession(): Promise<boolean> {
  return Boolean(await getPasswordRecoveryContextOrNull());
}

async function getPasswordRecoveryContextOrNull() {
  const supabase = await getServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (isAuthSessionMissingError(userError)) return null;
  if (userError) throw userError;

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (isAuthSessionMissingError(sessionError)) return null;
  if (sessionError) throw sessionError;

  const session = sessionData.session;
  if (!userData.user || !session || userData.user.id !== session.user.id) return null;

  const cookieStore = await cookies();
  const marker = cookieStore.get(PASSWORD_RECOVERY_COOKIE)?.value;
  if (!matchesPasswordRecoveryMarker(marker, session)) return null;

  return { cookieStore, supabase };
}

async function requirePasswordRecoveryContext() {
  const context = await getPasswordRecoveryContextOrNull();
  if (!context) {
    throw new AccountError(
      "RECOVERY_SESSION_REQUIRED",
      "비밀번호 변경 링크가 만료되었거나 이미 사용되었습니다. 새 링크를 받아 주세요."
    );
  }
  return context;
}

export async function completePasswordReset(input: unknown): Promise<void> {
  const parsed = PasswordResetCompleteSchema.parse(input);
  const { cookieStore, supabase } = await requirePasswordRecoveryContext();

  try {
    await repository.updateRecoveredPassword(supabase, parsed.newPassword);
    await repository.signOutAfterRecovery(supabase);
    clearPasswordRecoveryCookie(cookieStore, process.env.NODE_ENV === "production");
  } catch (error) {
    translateAuthError(error);
  }
}

export async function requestPhoneRegistration(input: unknown): Promise<string> {
  const parsed = PhoneOtpRequestSchema.parse(input);
  const { supabase } = await requireAccountContext();

  try {
    await repository.requestPhoneChange(supabase, parsed.phone);
    return parsed.phone;
  } catch (error) {
    translatePhoneAuthError(error);
  }
}

export async function verifyPhoneRegistration(input: unknown): Promise<string> {
  const parsed = PhoneOtpVerifySchema.parse(input);
  const { supabase, user } = await requireAccountContext();

  try {
    const verifiedUser = await repository.verifyPhoneChange(supabase, parsed.phone, parsed.token);
    if (verifiedUser.id !== user.id) {
      throw new AccountError(
        "PHONE_UNAVAILABLE",
        "휴대폰 번호를 현재 계정에 연결하지 못했습니다. 새 인증번호를 받아 주세요."
      );
    }
    return parsed.phone;
  } catch (error) {
    if (error instanceof AccountError) throw error;
    translatePhoneAuthError(error);
  }
}

export async function requestEmailRecoveryOtp(input: unknown): Promise<string> {
  const parsed = PhoneOtpRequestSchema.parse(input);
  const supabase = await getServerSupabase();

  try {
    await repository.requestEmailRecoveryOtp(supabase, parsed.phone);
  } catch (error) {
    // 전화번호 등록 여부를 요청 단계에서 노출하지 않고 동일한 응답을 반환한다.
    if (!isMissingPhoneAccountError(error)) translatePhoneAuthError(error);
  }

  return parsed.phone;
}

export async function verifyEmailRecoveryOtp(input: unknown): Promise<string> {
  const parsed = PhoneOtpVerifySchema.parse(input);
  const supabase = await getServerSupabase();
  let createdRecoverySession = false;

  try {
    const verifiedUser = await repository.verifyEmailRecoveryOtp(
      supabase,
      parsed.phone,
      parsed.token
    );
    createdRecoverySession = true;
    const email = verifiedUser.email?.trim();
    if (!email) {
      throw new AccountError(
        "RECOVERY_EMAIL_NOT_FOUND",
        "이 휴대폰 번호로 찾을 수 있는 이메일 계정이 없습니다."
      );
    }
    return maskEmail(email);
  } catch (error) {
    if (error instanceof AccountError) throw error;
    return translatePhoneAuthError(error);
  } finally {
    // 전화 OTP 검증이 만든 임시 로그인 세션을 이메일 조회 직후 제거한다.
    if (createdRecoverySession) {
      await repository.signOutAfterRecovery(supabase);
    }
  }
}
