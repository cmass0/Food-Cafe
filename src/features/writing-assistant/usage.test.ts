import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isWritingLimitDisabled } from "./usage";

describe("isWritingLimitDisabled", () => {
  test.each([
    [
      "개발 + 끄기 설정",
      true,
      { NODE_ENV: "development", WRITING_ASSISTANT_DISABLE_LIMIT: "true" },
    ],
    ["테스트 + 끄기 설정", true, { NODE_ENV: "test", WRITING_ASSISTANT_DISABLE_LIMIT: "true" }],
    [
      "운영 + 끄기 설정",
      false,
      { NODE_ENV: "production", WRITING_ASSISTANT_DISABLE_LIMIT: "true" },
    ],
    ["개발 + 설정 없음", false, { NODE_ENV: "development" }],
    [
      "개발 + true가 아닌 값",
      false,
      { NODE_ENV: "development", WRITING_ASSISTANT_DISABLE_LIMIT: "1" },
    ],
  ] as const)("%s이면 제한 끄기는 %s다", (_label, expected, env) => {
    expect(isWritingLimitDisabled(env)).toBe(expected);
  });
});
