import { describe, expect, test } from "vitest";

import {
  getRecipeCategoryLabel,
  getRecipeCategoryValues,
  isRecipeCategoryKey,
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_KEYS,
} from "./category";

describe("레시피 카테고리 필터", () => {
  test.each([
    ["korean", "한식"],
    ["meat", "고기·구이"],
    ["bunsik", "분식"],
    ["salad", "샐러드·건강식"],
    ["snack", "간식·야식"],
  ] as const)("%s 키를 표시명 %s와 같은 검색값으로 변환한다", (key, label) => {
    expect(isRecipeCategoryKey(key)).toBe(true);
    expect(getRecipeCategoryLabel(key)).toBe(label);
    expect(getRecipeCategoryValues(key)).toEqual([label]);
  });

  test("기타를 뺀 작성 카테고리는 모두 필터로 찾을 수 있다", () => {
    const filtered = new Set(RECIPE_CATEGORY_KEYS.flatMap((key) => getRecipeCategoryValues(key)));

    expect(RECIPE_CATEGORIES.filter((category) => !filtered.has(category))).toEqual(["기타"]);
  });

  test.each([undefined, null, "", "기타", "diet", "한식"])(
    "필터 키가 아닌 %s은 거부한다",
    (value) => {
      expect(isRecipeCategoryKey(value)).toBe(false);
    }
  );
});
