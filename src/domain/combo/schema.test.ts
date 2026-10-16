import { describe, expect, test } from "vitest";

import { COMBO_RECIPE_REFERENCE_ERRORS } from "./messages";
import { ComboFormSchema, ComboInsertSchema, ComboUpdateSchema } from "./schema";

const COMBO_ID = "00000000-0000-4000-8000-000000000001";

function createItems(length: number) {
  return Array.from({ length }, (_, index) => ({
    type: "product" as const,
    productName: `상품 ${index + 1}`,
  }));
}

const BASE_COMBO = {
  id: COMBO_ID,
  title: "라면과 김밥 조합",
  steps: [{ description: "함께 먹는다" }],
  difficulty: "쉬움",
};

describe("조합 레시피 ID 검증", () => {
  test.each([
    ["저장", ComboInsertSchema, BASE_COMBO],
    ["폼", ComboFormSchema, { ...BASE_COMBO, image: "/combos/cover.png" }],
  ] as const)("%s에서 잘못된 레시피 ID의 오류를 한글로 반환한다", (_label, schema, base) => {
    const result = schema.safeParse({
      ...base,
      items: [
        { type: "recipe", recipeid: "invalid" },
        { type: "product", productName: "물" },
      ],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ["items", 0, "recipeid"],
        message: "올바른 레시피 ID 또는 링크를 입력해 주세요.",
      })
    );
  });
  test.each([
    ["저장", ComboInsertSchema, BASE_COMBO],
    ["폼", ComboFormSchema, { ...BASE_COMBO, image: "/combos/cover.png" }],
  ] as const)(
    "%s에서 대문자가 섞인 레시피 ID는 DB와 같은 소문자로 맞춘다",
    (_label, schema, base) => {
      const id = "F76C7A5F-8E6D-58AA-826A-5752329B215C";
      const result = schema.safeParse({
        ...base,
        items: [
          { type: "recipe", recipeid: id, title: "김치볶음밥" },
          { type: "product", productName: "물" },
        ],
      });
      expect(result.success && result.data.items?.[0]).toMatchObject({
        recipeid: id.toLowerCase(),
      });
    }
  );
  test("비어 있는 레시피 ID는 입력 안내를 첫 오류로 반환한다", () => {
    const result = ComboInsertSchema.safeParse({
      ...BASE_COMBO,
      items: [
        { type: "recipe", recipeid: "" },
        { type: "product", productName: "물" },
      ],
    });
    const issues = result.error?.issues.filter(
      (issue) => issue.path.join(".") === "items.0.recipeid"
    );
    expect(issues?.[0]?.message).toBe("레시피 ID 또는 링크를 입력해 주세요.");
  });
});

describe("폼의 레시피 칸 불러오기 확인", () => {
  const RECIPE_ID = "00000000-0000-4000-8000-0000000000a1";
  const FORM_BASE = { ...BASE_COMBO, image: "/combos/cover.png" };
  const withRecipe = (title?: string) => [
    { type: "recipe" as const, recipeid: RECIPE_ID, title },
    { type: "product" as const, productName: "물" },
  ];

  test.each([
    ["제목이 없는", undefined],
    ["제목이 빈", ""],
    ["제목이 공백뿐인", "   "],
  ] as const)("폼에서 %s 레시피 칸은 그 칸에 불러오기 안내로 거부한다", (_label, title) => {
    const result = ComboFormSchema.safeParse({ ...FORM_BASE, items: withRecipe(title) });
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({
        path: ["items", 0, "recipeid"],
        message: COMBO_RECIPE_REFERENCE_ERRORS.notLoaded,
      }),
    ]);
  });

  test("폼에서 불러와 제목이 있는 레시피 칸은 받는다", () => {
    expect(
      ComboFormSchema.safeParse({ ...FORM_BASE, items: withRecipe("김치볶음밥") }).success
    ).toBe(true);
  });

  test("저장 요청은 제목이 없는 레시피 칸도 받는다(서버가 DB 값으로 채운다)", () => {
    expect(ComboInsertSchema.safeParse({ ...BASE_COMBO, items: withRecipe() }).success).toBe(true);
  });
});

function expectItemsFailure(result: {
  success: boolean;
  error?: { issues: Array<{ path: Array<string | number> }> };
}) {
  expect(result.success).toBe(false);
  if (result.success) return;
  expect(result.error?.issues.some((issue) => issue.path[0] === "items")).toBe(true);
}

describe("조합 조리 단계 개수와 길이", () => {
  const steps = (count: number, length = 10) =>
    Array.from({ length: count }, () => ({ description: "가".repeat(length) }));
  const FORM_BASE = { ...BASE_COMBO, image: "/combos/cover.png", items: createItems(2) };

  test.each([
    ["생성", ComboInsertSchema, { ...BASE_COMBO, items: createItems(2) }],
    ["수정", ComboUpdateSchema, {}],
    ["폼", ComboFormSchema, FORM_BASE],
  ] as const)("%s 규칙은 단계 50개·단계당 500자까지 허용한다", (_label, schema, base) => {
    expect(schema.safeParse({ ...base, steps: steps(50, 500) }).success).toBe(true);
  });

  test.each([
    ["생성", ComboInsertSchema, { ...BASE_COMBO, items: createItems(2) }],
    ["수정", ComboUpdateSchema, {}],
    ["폼", ComboFormSchema, FORM_BASE],
  ] as const)("%s 규칙은 단계 51개를 거부한다", (_label, schema, base) => {
    const result = schema.safeParse({ ...base, steps: steps(51) });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["steps"]]);
  });

  test.each([
    ["생성", ComboInsertSchema, { ...BASE_COMBO, items: createItems(2) }],
    ["수정", ComboUpdateSchema, {}],
    ["폼", ComboFormSchema, FORM_BASE],
  ] as const)("%s 규칙은 501자 단계를 거부한다", (_label, schema, base) => {
    const result = schema.safeParse({ ...base, steps: steps(1, 501) });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([["steps", 0, "description"]]);
  });

  test("앞뒤 공백은 빼고 세며, 공백뿐인 단계는 거부한다", () => {
    const base = { ...BASE_COMBO, items: createItems(2) };

    expect(
      ComboInsertSchema.safeParse({ ...base, steps: [{ description: ` ${"가".repeat(500)} ` }] })
        .success
    ).toBe(true);
    expect(ComboInsertSchema.safeParse({ ...base, steps: [{ description: "   " }] }).success).toBe(
      false
    );
  });
});

describe("조합 구성 항목 개수", () => {
  test.each([
    ["생성", ComboInsertSchema, BASE_COMBO],
    ["수정", ComboUpdateSchema, {}],
    ["폼", ComboFormSchema, { ...BASE_COMBO, image: "/combos/cover.png" }],
  ] as const)("%s에서는 2개와 10개를 허용한다", (_label, schema, base) => {
    expect(schema.safeParse({ ...base, items: createItems(2) }).success).toBe(true);
    expect(schema.safeParse({ ...base, items: createItems(10) }).success).toBe(true);
  });

  test.each([
    ["생성 0개", ComboInsertSchema, BASE_COMBO, 0],
    ["생성 1개", ComboInsertSchema, BASE_COMBO, 1],
    ["생성 11개", ComboInsertSchema, BASE_COMBO, 11],
    ["수정 0개", ComboUpdateSchema, {}, 0],
    ["수정 1개", ComboUpdateSchema, {}, 1],
    ["수정 11개", ComboUpdateSchema, {}, 11],
    ["폼 0개", ComboFormSchema, { ...BASE_COMBO, image: "/combos/cover.png" }, 0],
    ["폼 1개", ComboFormSchema, { ...BASE_COMBO, image: "/combos/cover.png" }, 1],
    ["폼 11개", ComboFormSchema, { ...BASE_COMBO, image: "/combos/cover.png" }, 11],
  ] as const)("%s는 거부한다", (_label, schema, base, length) => {
    const result = schema.safeParse({ ...base, items: createItems(length) });

    expectItemsFailure(result);
  });
});
