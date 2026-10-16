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
  test("폼의 레시피 ID에 대문자가 섞여 있어도 초안의 같은 레시피와 짝지어 두 번 넣지 않는다", () => {
    const upper: FormItem = { ...riceRow, recipeid: RICE.toUpperCase().replace("0000", "ABCD") };
    const draftRice: DraftItem = {
      type: "recipe",
      recipeid: RICE.replace("0000", "abcd"),
      title: "김치볶음밥",
    };
    const { items, restored } = mergeComboDraftItems([upper], [draftRice, draftProduct("단무지")]);
    expect(items).toEqual([upper, { ...draftProduct("단무지"), image: null }]);
    expect(restored).toEqual([]);
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
  test("폼에 넣은 상품은 초안에 같은 이름이 있으면 폼의 이름·설명·사진을 그대로 쓴다", () => {
    const cup = formProduct("컵라면", "https://example.com/cup.jpg");
    const { items } = mergeComboDraftItems(
      [riceRow, cup],
      [draftRecipe(RICE), draftProduct("컵라면")]
    );
    expect(items[1]).toBe(cup);
  });
  test("이름 앞뒤 공백만 다른 상품은 폼에 넣은 상품으로 본다", () => {
    const cup = formProduct("컵라면 ");
    const { items } = mergeComboDraftItems([cup], [draftProduct("컵라면"), draftProduct("김밥")]);
    expect(items).toEqual([cup, { ...draftProduct("김밥"), image: null }]);
  });
  test("AI가 새로 제안한 상품은 사진 없이(null) 더한다", () => {
    const { items } = mergeComboDraftItems([riceRow], [draftRecipe(RICE), draftProduct("단무지")]);
    expect(items[1]).toEqual({ ...draftProduct("단무지"), image: null });
  });
  test("초안에 없는 폼 상품도 끝에 남기고 이름이 빈 상품 칸은 남기지 않는다", () => {
    const cup = formProduct("신라면 컵", "https://example.com/cup.jpg");
    const seaweed = formProduct("김");
    const { items } = mergeComboDraftItems(
      [riceRow, cup, seaweed, formProduct(" ")],
      [draftRecipe(RICE), draftProduct("신라면")]
    );
    expect(items).toEqual([riceRow, { ...draftProduct("신라면"), image: null }, cup, seaweed]);
  });
  test("10개를 넘으면 AI가 새로 제안한 상품만 뒤에서부터 빼고 폼에 넣은 항목은 남긴다", () => {
    const suggested = Array.from({ length: 9 }, (_, index) => draftProduct(`제안 ${index + 1}`));
    const mine = formProduct("내 상품", "https://example.com/mine.jpg");
    const { items } = mergeComboDraftItems(
      [riceRow, soupRow, mine],
      [draftRecipe(RICE), ...suggested]
    );
    expect(items).toHaveLength(10);
    expect(items.slice(-2)).toEqual([soupRow, mine]);
    expect(items.slice(1, 8)).toEqual(
      suggested.slice(0, 7).map((product) => ({ ...product, image: null }))
    );
  });
});
