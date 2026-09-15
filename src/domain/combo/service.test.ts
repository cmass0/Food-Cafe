import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { toArrayItems, toArraySteps } from "./service";

describe("조합 JSON 변환", () => {
  test.each([
    ["null", null],
    ["undefined", undefined],
    ["객체", { description: "섞는다" }],
  ] as const)("조리 단계가 배열이 아닌 %s이면 빈 배열을 반환한다", (_label, value) => {
    expect(toArraySteps(value)).toEqual([]);
  });

  test("조리 단계 문자열을 다듬고 빈 항목을 제외한다", () => {
    expect(toArraySteps([{ description: "  함께 담는다  " }, { description: " " }, null])).toEqual([
      { description: "함께 담는다" },
    ]);
  });

  test("레시피와 상품 항목을 구분해 문자열을 다듬는다", () => {
    expect(
      toArrayItems([
        {
          type: "recipe",
          recipeid: "  recipe-1  ",
          title: "  김치볶음밥  ",
          summary: "  매콤함  ",
          image: "https://example.com/recipe.jpg",
        },
        {
          type: "product",
          productName: "  탄산수  ",
          summary: "  시원함  ",
          image: "https://example.com/product.jpg",
        },
      ])
    ).toEqual([
      {
        type: "recipe",
        recipeid: "recipe-1",
        title: "김치볶음밥",
        summary: "매콤함",
        image: "https://example.com/recipe.jpg",
      },
      {
        type: "product",
        productName: "탄산수",
        summary: "시원함",
        image: "https://example.com/product.jpg",
      },
    ]);
  });

  test("지원하지 않는 항목 형식은 제외한다", () => {
    expect(toArrayItems([{ type: "unknown", name: "항목" }, null, "상품"])).toEqual([]);
  });
});
