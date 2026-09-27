import { describe, expect, test } from "vitest";

import { addViewedContent, parseViewHistory, type ViewedContent } from "./view-history";

const RECIPE_A: ViewedContent = { sourceType: "recipe", sourceId: "recipe-a", viewedAt: 100 };
const RECIPE_B: ViewedContent = { sourceType: "recipe", sourceId: "recipe-b", viewedAt: 200 };
const COMBO_A: ViewedContent = { sourceType: "combo", sourceId: "recipe-a", viewedAt: 300 };

function createHistory(count: number): ViewedContent[] {
  return Array.from({ length: count }, (_, index) => ({
    sourceType: "recipe",
    sourceId: `recipe-${index}`,
    viewedAt: index,
  }));
}

describe("addViewedContent", () => {
  test("빈 기록에 첫 조회를 추가한다", () => {
    expect(addViewedContent([], RECIPE_A)).toEqual([RECIPE_A]);
  });

  test("방금 본 항목을 맨 앞에 둔다", () => {
    expect(addViewedContent([RECIPE_A], RECIPE_B)).toEqual([RECIPE_B, RECIPE_A]);
  });

  test("다시 본 항목은 이전 기록을 지우고 새 조회 시각으로 맨 앞에 둔다", () => {
    const viewedAgain = { ...RECIPE_A, viewedAt: 999 };

    expect(addViewedContent([RECIPE_B, RECIPE_A], viewedAgain)).toEqual([viewedAgain, RECIPE_B]);
  });

  test("ID가 같아도 레시피와 조합은 다른 항목으로 본다", () => {
    expect(addViewedContent([RECIPE_A], COMBO_A)).toEqual([COMBO_A, RECIPE_A]);
  });

  test.each([
    [19, 20],
    [20, 20],
    [25, 20],
  ] as const)("기존 기록 %s개에 추가하면 최근 %s개만 남긴다", (count, expectedLength) => {
    const history = createHistory(count);
    const result = addViewedContent(history, RECIPE_A);

    expect(result).toHaveLength(expectedLength);
    expect(result[0]).toEqual(RECIPE_A);
    expect(result.at(-1)).toEqual(history[expectedLength - 2]);
  });

  test("20개가 찬 기록에서 다시 본 항목은 다른 기록을 밀어내지 않는다", () => {
    const history = createHistory(20);
    const viewedAgain: ViewedContent = {
      sourceType: "recipe",
      sourceId: "recipe-5",
      viewedAt: 999,
    };

    expect(addViewedContent(history, viewedAgain)).toEqual([
      viewedAgain,
      ...history.slice(0, 5),
      ...history.slice(6),
    ]);
  });

  test("원본 기록 배열을 바꾸지 않는다", () => {
    const history = [RECIPE_A, RECIPE_B];

    addViewedContent(history, { ...RECIPE_B, viewedAt: 999 });

    expect(history).toEqual([RECIPE_A, RECIPE_B]);
  });
});

describe("parseViewHistory", () => {
  test("저장된 기록을 순서대로 읽는다", () => {
    expect(parseViewHistory(JSON.stringify([RECIPE_B, COMBO_A]))).toEqual([RECIPE_B, COMBO_A]);
  });

  test.each([
    ["저장값 없음", null],
    ["빈 문자열", ""],
    ["깨진 JSON", "[{"],
    ["배열이 아닌 객체", JSON.stringify({ sourceType: "recipe", sourceId: "a", viewedAt: 1 })],
    ["빈 배열", "[]"],
  ] as const)("%s은 빈 기록으로 읽는다", (_label, raw) => {
    expect(parseViewHistory(raw)).toEqual([]);
  });

  test.each([
    ["null", null],
    ["문자열", "recipe-a"],
    ["지원하지 않는 종류", { ...RECIPE_A, sourceType: "post" }],
    ["빈 ID", { ...RECIPE_A, sourceId: "" }],
    ["숫자 ID", { ...RECIPE_A, sourceId: 1 }],
    ["조회 시각 누락", { sourceType: "recipe", sourceId: "recipe-a" }],
    ["문자열 조회 시각", { ...RECIPE_A, viewedAt: "100" }],
  ] as const)("형식이 맞지 않는 항목(%s)은 버리고 나머지는 유지한다", (_label, invalid) => {
    expect(parseViewHistory(JSON.stringify([RECIPE_B, invalid, COMBO_A]))).toEqual([
      RECIPE_B,
      COMBO_A,
    ]);
  });
});
