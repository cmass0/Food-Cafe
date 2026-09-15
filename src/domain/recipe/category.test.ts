import { describe, expect, test } from "vitest";

import { getRecipeCategoryLabel, getRecipeCategoryValues, isRecipeCategoryKey } from "./category";

describe("레시피 카테고리 필터", () => {
  test.each([
    ["western", "양식", ["양식", "pasta"]],
    ["salad", "샐러드", ["샐러드", "salad"]],
    ["snack", "간식", ["간식", "분식"]],
  ] as const)("%s 키를 표시명과 검색값으로 변환한다", (key, label, values) => {
    expect(isRecipeCategoryKey(key)).toBe(true);
    expect(getRecipeCategoryLabel(key)).toBe(label);
    expect(getRecipeCategoryValues(key)).toEqual(values);
  });

  test.each([undefined, null, "", "기타", "pasta"])("필터 키가 아닌 %s은 거부한다", (value) => {
    expect(isRecipeCategoryKey(value)).toBe(false);
  });
});
