import { describe, expect, test } from "vitest";

import {
  getRecipeCategoryKey,
  getRecipeCategoryLabel,
  getRecipeCategoryValues,
  isRecipeCategory,
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

describe("저장된 카테고리 값", () => {
  test.each([
    ["한식", "korean"],
    ["고기·구이", "meat"],
    ["디저트·베이킹", "dessert"],
    ["간식·야식", "snack"],
  ] as const)("%s는 필터 키 %s로 찾는다", (category, key) => {
    expect(getRecipeCategoryKey(category)).toBe(key);
  });

  test("기타를 뺀 작성 카테고리는 모두 같은 표시명의 필터 키로 돌아간다", () => {
    const withoutKey = RECIPE_CATEGORIES.filter((category) => {
      const key = getRecipeCategoryKey(category);
      return !key || getRecipeCategoryLabel(key) !== category;
    });

    expect(withoutKey).toEqual(["기타"]);
  });

  test.each([undefined, null, "", "기타", "디저트", "korean"])(
    "필터가 없는 %s는 키를 찾지 않는다",
    (value) => {
      expect(getRecipeCategoryKey(value)).toBeUndefined();
    }
  );

  test.each(["한식", "기타"])("작성 카테고리 %s는 목록 값이다", (value) => {
    expect(isRecipeCategory(value)).toBe(true);
  });

  test.each([undefined, null, "", "디저트", "korean"])("%s는 목록 값이 아니다", (value) => {
    expect(isRecipeCategory(value)).toBe(false);
  });
});
