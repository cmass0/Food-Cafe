import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { Session } from "@supabase/supabase-js";

export const PASSWORD_RECOVERY_COOKIE = "foodcafe-password-recovery";
export const PASSWORD_RECOVERY_COOKIE_PATH = "/auth/recovery";
export const PASSWORD_RECOVERY_MAX_AGE = 15 * 60;

type RecoveryCookieWriter = {
  set(
    name: string,
    value: string,
    options: {
      expires?: Date;
      httpOnly: boolean;
      maxAge?: number;
      path: string;
      sameSite: "lax";
      secure: boolean;
    }
  ): void;
};

// 복구 콜백에서 발급된 세션과 복구 화면의 세션이 같은지 확인할 표식을 만든다.
export function createPasswordRecoveryMarker(session: Session): string {
  return createHash("sha256")
    .update(`${session.user.id}:${session.access_token}`)
    .digest("base64url");
}

// 단순 쿠키 존재 여부가 아니라 현재 Supabase 세션과 연결된 표식인지 비교한다.
export function matchesPasswordRecoveryMarker(
  marker: string | undefined,
  session: Session
): boolean {
  if (!marker) return false;

  const expected = Buffer.from(createPasswordRecoveryMarker(session));
  const actual = Buffer.from(marker);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function setPasswordRecoveryCookie(
  cookies: RecoveryCookieWriter,
  session: Session,
  secure: boolean
) {
  cookies.set(PASSWORD_RECOVERY_COOKIE, createPasswordRecoveryMarker(session), {
    httpOnly: true,
    maxAge: PASSWORD_RECOVERY_MAX_AGE,
    path: PASSWORD_RECOVERY_COOKIE_PATH,
    sameSite: "lax",
    secure,
  });
}

export function clearPasswordRecoveryCookie(cookies: RecoveryCookieWriter, secure: boolean) {
  cookies.set(PASSWORD_RECOVERY_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: PASSWORD_RECOVERY_COOKIE_PATH,
    sameSite: "lax",
    secure,
  });
}
