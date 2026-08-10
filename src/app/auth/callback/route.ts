import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { normalizeReturnTo } from "@/lib/auth/return-to";
import {
  clearPasswordRecoveryCookie,
  setPasswordRecoveryCookie,
} from "@/lib/auth/recovery-session";
import type { Database } from "@/types/supabase";

function getRedirectType(data: unknown): string | null {
  if (!data || typeof data !== "object" || !("redirectType" in data)) return null;
  return typeof data.redirectType === "string" ? data.redirectType : null;
}

export async function GET(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const isRecoveryFlow = req.nextUrl.searchParams.get("flow") === "recovery";
  const useSecureCookies = req.nextUrl.protocol === "https:";
  const failurePath = isRecoveryFlow ? "/auth/recovery?error=invalid-link" : "/";
  const rawNext = req.nextUrl.searchParams.get("next") ?? "/";
  const next = normalizeReturnTo(rawNext);
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    const failedResponse = NextResponse.redirect(new URL(failurePath, req.url));
    failedResponse.headers.set("Cache-Control", "private, no-store");
    if (isRecoveryFlow) {
      clearPasswordRecoveryCookie(failedResponse.cookies, useSecureCookies);
    }
    return failedResponse;
  }

  const redirectUrl = new URL(next, req.url);
  const response = NextResponse.redirect(redirectUrl);
  response.headers.set("Cache-Control", "private, no-store");

  const supabase = createServerClient<Database>(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] 인증 코드 교환 실패", {
      code: error.code,
      flow: isRecoveryFlow ? "recovery" : "default",
      message: error.message,
    });
    const failedResponse = NextResponse.redirect(new URL(failurePath, req.url));
    failedResponse.headers.set("Cache-Control", "private, no-store");
    if (isRecoveryFlow) {
      clearPasswordRecoveryCookie(failedResponse.cookies, useSecureCookies);
    }
    return failedResponse;
  }

  if (isRecoveryFlow) {
    if (getRedirectType(data) !== "recovery" || !data.session) {
      console.error("[auth/callback] 비밀번호 복구가 아닌 인증 코드가 복구 경로로 전달됨");
      const failedResponse = NextResponse.redirect(new URL(failurePath, req.url));
      failedResponse.headers.set("Cache-Control", "private, no-store");
      clearPasswordRecoveryCookie(failedResponse.cookies, useSecureCookies);
      return failedResponse;
    }

    // 실제 PASSWORD_RECOVERY 코드 교환에 성공한 경우에만 재설정 화면 접근 표식을 남긴다.
    setPasswordRecoveryCookie(response.cookies, data.session, useSecureCookies);
  }

  return response;
}
