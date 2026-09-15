import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  normaliseImageArray,
  normaliseTextArray,
  toArrayIngredient,
  toArraySteps,
} from "./service";

describe("레시피 배열 변환", () => {
  test.each([
    ["null", null],
    ["undefined", undefined],
    ["빈 배열", [] as string[]],
  ] as const)("텍스트 목록이 %s이면 빈 배열을 반환한다", (_label, value) => {
    expect(normaliseTextArray(value)).toEqual([]);
  });

  test("빈 문자열을 제거하고 나머지 텍스트 순서를 보존한다", () => {
    expect(normaliseTextArray(["한식", "", "간단"])).toEqual(["한식", "간단"]);
  });

  test("이미지 목록이 비어 있으면 대표 이미지를 사용한다", () => {
    expect(normaliseImageArray([], "recipes/user/recipe/cover.jpg")).toEqual([
      "recipes/user/recipe/cover.jpg",
    ]);
  });

  test("이미지 목록이 있으면 대표 이미지를 중복 추가하지 않는다", () => {
    expect(normaliseImageArray(["first.jpg", "second.jpg"], "cover.jpg")).toEqual([
      "first.jpg",
      "second.jpg",
    ]);
  });
});

describe("레시피 JSON 변환", () => {
  test("재료 문자열을 다듬고 비어 있는 항목과 다른 형식을 제외한다", () => {
    expect(
      toArrayIngredient([
        { name: "  감자 ", amount: " 2 ", unit: " 개 ", unitCustom: " " },
        { name: " ", amount: " ", unit: " ", unitCustom: " " },
        null,
        "감자",
      ])
    ).toEqual([{ name: "감자", amount: "2", unit: "개", unitCustom: "" }]);
  });

  test.each([
    ["null", null],
    ["객체", { description: "볶는다" }],
    ["문자열", "볶는다"],
  ] as const)("재료 목록이 배열이 아닌 %s이면 빈 배열을 반환한다", (_label, value) => {
    expect(toArrayIngredient(value)).toEqual([]);
  });

  test("조리 단계 문자열을 다듬고 빈 단계와 다른 형식을 제외한다", () => {
    expect(
      toArraySteps([{ description: "  볶는다  " }, { description: " " }, null, "끓인다"])
    ).toEqual([{ description: "볶는다" }]);
  });
});
