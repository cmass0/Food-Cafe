import { describe, expect, test } from "vitest";

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

function expectItemsFailure(result: {
  success: boolean;
  error?: { issues: Array<{ path: Array<string | number> }> };
}) {
  expect(result.success).toBe(false);
  if (result.success) return;
  expect(result.error?.issues.some((issue) => issue.path[0] === "items")).toBe(true);
}

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
