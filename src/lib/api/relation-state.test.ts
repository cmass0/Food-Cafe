import { describe, expect, test } from "vitest";

import { readRelationState } from "./relation-state";

function requestWith(body: string) {
  return new Request("http://localhost/api/recipes/r1/like", { method: "POST", body });
}

describe("readRelationState", () => {
  test.each([
    ["true", true],
    ["false", false],
  ] as const)("liked가 %s이면 그 상태를 읽는다", async (value, expected) => {
    await expect(readRelationState(requestWith(`{"liked":${value}}`), "liked")).resolves.toBe(
      expected
    );
  });

  test("요청한 필드만 읽고 다른 필드는 무시한다", async () => {
    const req = requestWith(JSON.stringify({ liked: true, bookmarked: false }));

    await expect(readRelationState(req, "bookmarked")).resolves.toBe(false);
  });

  test.each([
    ["문자열 true", JSON.stringify({ liked: "true" })],
    ["숫자 1", JSON.stringify({ liked: 1 })],
    ["null", JSON.stringify({ liked: null })],
    ["필드 없음", JSON.stringify({})],
    ["옛 토글 본문", JSON.stringify({ recipeId: "r1", currentlyBookmarked: true })],
    ["배열", JSON.stringify([true])],
    ["JSON null", "null"],
    ["빈 본문", ""],
    ["깨진 JSON", "{liked:"],
  ] as const)("%s은 상태로 인정하지 않는다", async (_label, body) => {
    await expect(readRelationState(requestWith(body), "liked")).resolves.toBeNull();
  });
});
