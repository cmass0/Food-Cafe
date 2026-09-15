import { describe, expect, test } from "vitest";

import type { User } from "@supabase/supabase-js";

import { deriveDisplayName, derivePublicDisplayName } from "./displayName";

function createUser(input: Partial<User>): User {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-01-01T00:00:00.000Z",
    ...input,
  } as User;
}

describe("사용자 표시 이름", () => {
  test.each([
    [
      "공통 표시 이름",
      { user_metadata: { display_name: "홍길동", full_name: "다른 이름" } },
      "홍길동",
    ],
    [
      "GitHub 사용자 이름",
      { identities: [{ provider: "github", identity_data: { user_name: "github-user" } }] },
      "github-user",
    ],
    [
      "Google 이름",
      { identities: [{ provider: "google", identity_data: { name: "Google User" } }] },
      "Google User",
    ],
    [
      "Kakao 닉네임",
      {
        identities: [
          { provider: "kakao", identity_data: { properties: { nickname: "카카오 사용자" } } },
        ],
      },
      "카카오 사용자",
    ],
  ] as const)("%s을 공개 이름으로 선택한다", (_label, input, expected) => {
    expect(derivePublicDisplayName(createUser(input as Partial<User>))).toBe(expected);
  });

  test("이메일만 있는 계정은 공개 이름에서 이메일을 제외한다", () => {
    const user = createUser({ email: "private@example.com" });

    expect(derivePublicDisplayName(user)).toBeNull();
    expect(deriveDisplayName(user)).toBe("private@example.com");
  });

  test("사용자가 없으면 공개 이름과 개인 표시 이름을 반환하지 않는다", () => {
    expect(derivePublicDisplayName(null)).toBeNull();
    expect(deriveDisplayName(null)).toBeNull();
  });
});
