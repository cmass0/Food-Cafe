import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { Session } from "@supabase/supabase-js";

import { createPasswordRecoveryMarker, matchesPasswordRecoveryMarker } from "./recovery-session";

function createSession(userId: string, accessToken: string): Session {
  return {
    user: { id: userId },
    access_token: accessToken,
  } as Session;
}

describe("비밀번호 복구 세션 표식", () => {
  test("같은 사용자와 토큰은 같은 표식을 만든다", () => {
    const session = createSession("user-1", "token-1");

    expect(createPasswordRecoveryMarker(session)).toBe(createPasswordRecoveryMarker(session));
  });

  test.each([
    ["사용자 변경", createSession("user-2", "token-1")],
    ["토큰 변경", createSession("user-1", "token-2")],
  ] as const)("%s 시 기존 표식과 일치하지 않는다", (_label, changedSession) => {
    const marker = createPasswordRecoveryMarker(createSession("user-1", "token-1"));

    expect(matchesPasswordRecoveryMarker(marker, changedSession)).toBe(false);
  });

  test.each([undefined, "", "short-marker"])("표식 %s은 현재 세션과 일치하지 않는다", (marker) => {
    expect(matchesPasswordRecoveryMarker(marker, createSession("user-1", "token-1"))).toBe(false);
  });

  test("현재 세션에서 만든 표식은 일치한다", () => {
    const session = createSession("user-1", "token-1");
    const marker = createPasswordRecoveryMarker(session);

    expect(matchesPasswordRecoveryMarker(marker, session)).toBe(true);
  });
});
