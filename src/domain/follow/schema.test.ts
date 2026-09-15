import { describe, expect, test } from "vitest";

import { followListQuerySchema, followTargetSchema, mentionCandidateQuerySchema } from "./schema";

const USER_ID = "00000000-0000-4000-8000-000000000001";

describe("팔로우 요청", () => {
  test("UUID 사용자 ID를 허용한다", () => {
    expect(followTargetSchema.parse(USER_ID)).toBe(USER_ID);
  });

  test.each(["", "user-1", null, undefined])("사용자 ID %s은 거부한다", (value) => {
    expect(followTargetSchema.safeParse(value).success).toBe(false);
  });

  test("목록 숫자 문자열을 변환하고 기본값을 적용한다", () => {
    expect(followListQuerySchema.parse({ type: "followers" })).toEqual({
      type: "followers",
      page: 1,
      limit: 20,
    });
    expect(followListQuerySchema.parse({ type: "following", page: "2", limit: "50" })).toEqual({
      type: "following",
      page: 2,
      limit: 50,
    });
  });

  test.each([
    ["없는 목록 종류", { type: "friends" }],
    ["0 페이지", { type: "followers", page: 0 }],
    ["소수 페이지", { type: "followers", page: 1.5 }],
    ["51개 조회", { type: "followers", limit: 51 }],
  ] as const)("%s은 거부한다", (_label, input) => {
    expect(followListQuerySchema.safeParse(input).success).toBe(false);
  });
});

describe("멘션 후보 요청", () => {
  test("검색어 공백을 제거하고 기본 페이지를 적용한다", () => {
    expect(mentionCandidateQuerySchema.parse({ q: "  철수  " })).toEqual({
      q: "철수",
      page: 1,
      limit: 10,
    });
  });

  test.each([
    ["빈 검색어", { q: "   " }],
    ["51자 검색어", { q: "가".repeat(51) }],
    ["11개 조회", { q: "철", limit: 11 }],
  ] as const)("%s은 거부한다", (_label, input) => {
    expect(mentionCandidateQuerySchema.safeParse(input).success).toBe(false);
  });
});
