import { describe, expect, test } from "vitest";

import type { ComboFormValues } from "@/domain/combo/types";
import { mergeComboDraftItems } from "./combo-draft";
import type { ComboWritingDraft } from "./types";

type FormItem = ComboFormValues["items"][number];
type DraftItem = ComboWritingDraft["items"][number];

const RICE = "00000000-0000-4000-8000-000000000001";
const SOUP = "00000000-0000-4000-8000-000000000002";
const riceRow: FormItem = {
  type: "recipe",
  recipeid: RICE,
  title: "김치볶음밥",
  summary: "원래 설명",
  image: "https://example.com/rice.jpg",
};
const soupRow: FormItem = { type: "recipe", recipeid: SOUP, title: "계란국" };
const draftRecipe = (id: string): DraftItem => ({ type: "recipe", recipeid: id, title: "AI 이름" });
const draftProduct = (name: string): DraftItem => ({
  type: "product",
  productName: name,
  summary: "AI 설명",
});
const formProduct = (name: string, image?: string): FormItem => ({
  type: "product",
  productName: name,
  summary: "",
  image,
});

describe("mergeComboDraftItems", () => {
  test("레시피는 초안 대신 폼에 불러온 행을 그대로 쓴다", () => {
    const { items } = mergeComboDraftItems([riceRow], [draftRecipe(RICE), draftProduct("단무지")]);
    expect(items[0]).toBe(riceRow);
  });
  test("초안에 없는 폼 레시피도 끝에 남긴다", () => {
    const { items } = mergeComboDraftItems(
      [riceRow, soupRow],
      [draftRecipe(RICE), draftProduct("단무지")]
    );
    expect(items).toEqual([riceRow, { ...draftProduct("단무지"), image: null }, soupRow]);
  });
  test("답을 받은 뒤 폼에서 지운 레시피가 초안에 있으면 초안 자리에 다시 넣는다", () => {
    const { items } = mergeComboDraftItems(
      [riceRow],
      [draftRecipe(RICE), draftRecipe(SOUP), draftProduct("단무지")]
    );
    expect(items).toEqual([
      riceRow,
      { type: "recipe", recipeid: SOUP, title: "AI 이름", summary: "", image: null },
      { ...draftProduct("단무지"), image: null },
    ]);
  });
  test("다시 넣은 레시피는 반영 확인창에 보여 줄 이름으로 알린다", () => {
    const { restored } = mergeComboDraftItems([riceRow], [draftRecipe(RICE), draftRecipe(SOUP)]);
    expect(restored).toEqual(["AI 이름"]);
  });
  test("폼에 남아 있는 레시피는 다시 넣은 레시피로 알리지 않는다", () => {
    const { restored } = mergeComboDraftItems(
      [riceRow, soupRow],
      [draftRecipe(RICE), draftRecipe(SOUP)]
    );
    expect(restored).toEqual([]);
  });
  test("레시피 ID를 비워 둔 칸은 남기지 않는다", () => {
    const empty: FormItem = { type: "recipe", recipeid: "  " };
    const { items } = mergeComboDraftItems(
      [empty],
      [draftProduct("컵라면"), draftProduct("즉석밥")]
    );
    expect(items).not.toContain(empty);
  });
  test("같은 레시피를 두 칸에 넣었으면 두 칸 모두 남긴다", () => {
    const twin: FormItem = { ...riceRow };
    const { items } = mergeComboDraftItems(
      [riceRow, twin],
      [draftRecipe(RICE), draftProduct("단무지")]
    );
    expect(items.filter((item) => item.type === "recipe")).toEqual([riceRow, twin]);
  });
  test("상품은 초안을 따르고 이름이 같은 폼 상품의 사진을 이어받는다", () => {
    const { items } = mergeComboDraftItems(
      [riceRow, formProduct("컵라면", "https://example.com/cup.jpg")],
      [draftRecipe(RICE), draftProduct("컵라면")]
    );
    expect(items[1]).toEqual({ ...draftProduct("컵라면"), image: "https://example.com/cup.jpg" });
  });
  test("이름이 같은 폼 상품이 없으면 사진을 비운 값(null)으로 둔다", () => {
    const { items } = mergeComboDraftItems([riceRow], [draftRecipe(RICE), draftProduct("단무지")]);
    expect(items[1]).toEqual({ ...draftProduct("단무지"), image: null });
  });
  test("초안에 없는 폼 상품은 빠지는 항목으로 알리고 사진이 있으면 함께 적는다", () => {
    const { removed } = mergeComboDraftItems(
      [
        riceRow,
        formProduct("신라면 컵", "https://example.com/cup.jpg"),
        formProduct("김"),
        formProduct(" "),
      ],
      [draftRecipe(RICE), draftProduct("신라면")]
    );
    expect(removed).toEqual(["신라면 컵 (사진 포함)", "김"]);
  });
  test("10개를 넘으면 상품을 뒤에서부터 빼고 그 상품의 폼 칸도 빠지는 항목으로 알린다", () => {
    const products = Array.from({ length: 9 }, (_, index) => draftProduct(`상품 ${index + 1}`));
    const { items, removed } = mergeComboDraftItems(
      [riceRow, soupRow, formProduct("상품 9", "https://example.com/9.jpg")],
      [draftRecipe(RICE), ...products]
    );
    expect(items).toHaveLength(10);
    expect(items.at(-1)).toBe(soupRow);
    expect(removed).toEqual(["상품 9 (사진 포함)"]);
  });
});
