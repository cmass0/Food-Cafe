import "server-only";

import { headers } from "next/headers";

import { normalizeReturnTo } from "./return-to";

type AuthCallbackUrlOptions = {
  next: string;
  flow?: "recovery";
};

// 현재 요청과 같은 출처의 공통 인증 콜백 URL만 생성해 외부 주소로의 이동을 막는다.
export async function buildAuthCallbackUrl({
  next,
  flow,
}: AuthCallbackUrlOptions): Promise<string> {
  const requestHeaders = await headers();
  const rawOrigin = requestHeaders.get("origin");
  const requestHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!rawOrigin || !requestHost) {
    throw new Error("요청 출처를 확인할 수 없습니다.");
  }

  const origin = new URL(rawOrigin);
  const trustedHost = requestHost.split(",")[0]?.trim();
  if (
    (origin.protocol !== "http:" && origin.protocol !== "https:") ||
    origin.host !== trustedHost
  ) {
    throw new Error("유효하지 않은 요청 출처입니다.");
  }

  const callbackUrl = new URL("/auth/callback", origin.origin);
  callbackUrl.searchParams.set("next", normalizeReturnTo(next));
  if (flow) callbackUrl.searchParams.set("flow", flow);
  return callbackUrl.toString();
}
