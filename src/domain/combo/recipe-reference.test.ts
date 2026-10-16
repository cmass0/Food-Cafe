import { describe, expect, test } from "vitest";

import { fillRecipeItems, parseRecipeReference, type ComboRecipeSource } from "./recipe-reference";
import type { ComboItems } from "./types";

const RECIPE_ID = "00000000-0000-4000-8000-000000000001";
const SOUP_ID = "00000000-0000-4000-8000-000000000002";

describe("parseRecipeReference", () => {
  test.each([
    ["레시피 ID", RECIPE_ID],
    ["앞뒤 공백이 있는 ID", `  ${RECIPE_ID}  `],
    ["레시피 링크", `https://food.example/recipes/${RECIPE_ID}`],
    ["끝에 /가 붙은 링크", `https://food.example/recipes/${RECIPE_ID}/`],
    ["쿼리가 붙은 링크", `https://food.example/recipes/${RECIPE_ID}?from=combo`],
    ["해시가 붙은 링크", `https://food.example/recipes/${RECIPE_ID}#steps`],
    ["쿼리와 해시가 함께 붙은 링크", `https://food.example/recipes/${RECIPE_ID}?from=combo#steps`],
    ["사이트 안 경로", `/recipes/${RECIPE_ID}`],
  ] as const)("%s에서 레시피 ID를 꺼낸다", (_label, input) => {
    expect(parseRecipeReference(input)).toBe(RECIPE_ID);
  });

  test.each([
    ["빈 입력", ""],
    ["공백만 있는 입력", "   "],
    ["/만 있는 입력", "/"],
    ["쿼리만 있는 입력", "?from=combo"],
    ["해시만 있는 입력", "#steps"],
  ] as const)("%s은 꺼낼 ID가 없다", (_label, input) => {
    expect(parseRecipeReference(input)).toBeNull();
  });

  test("ID 형식은 보지 않고 마지막 경로 조각을 그대로 꺼낸다", () => {
    expect(parseRecipeReference("https://food.example/recipes/not-a-uuid")).toBe("not-a-uuid");
  });
});

describe("fillRecipeItems", () => {
  const rice: ComboRecipeSource = {
    id: RECIPE_ID,
    title: "김치볶음밥",
    summary: "매콤한 볶음밥",
    image: "https://example.com/rice.jpg",
  };
  const recipeItem = (recipeid: string, patch: Partial<ComboItems> = {}): ComboItems =>
    ({ type: "recipe", recipeid, ...patch }) as ComboItems;
  const product: ComboItems = {
    type: "product",
    productName: "단무지",
    summary: "곁들임",
    image: "combos/user/combo/pickle.jpg",
  };

  test("제목이 비어 있는 레시피 항목을 DB의 제목·설명·사진으로 채운다", () => {
    const { items } = fillRecipeItems([recipeItem(RECIPE_ID)], [rice]);
    expect(items).toEqual([
      {
        type: "recipe",
        recipeid: RECIPE_ID,
        title: "김치볶음밥",
        summary: "매콤한 볶음밥",
        image: "https://example.com/rice.jpg",
      },
    ]);
  });

  test("브라우저가 보낸 제목·설명·사진은 DB 값으로 덮어쓴다", () => {
    const sent = recipeItem(RECIPE_ID, {
      title: "가짜 제목",
      summary: "가짜 설명",
      image: "https://evil.example/fake.jpg",
    });
    expect(fillRecipeItems([sent], [rice]).items[0]).toMatchObject({
      title: "김치볶음밥",
      summary: "매콤한 볶음밥",
      image: "https://example.com/rice.jpg",
    });
  });

  test("설명·사진이 없는 레시피는 설명을 비우고 사진을 null로 둔다", () => {
    const plain = { ...rice, summary: null, image: null };
    const sent = recipeItem(RECIPE_ID, {
      summary: "예전 설명",
      image: "https://example.com/old.jpg",
    });
    expect(fillRecipeItems([sent], [plain]).items[0]).toEqual({
      type: "recipe",
      recipeid: RECIPE_ID,
      title: "김치볶음밥",
      summary: undefined,
      image: null,
    });
  });

  test("상품 항목은 그대로 둔다", () => {
    expect(fillRecipeItems([product], [rice]).items).toEqual([product]);
  });

  test("같은 레시피를 두 칸에 넣었으면 두 칸 모두 채운다", () => {
    const { items } = fillRecipeItems([recipeItem(RECIPE_ID), recipeItem(RECIPE_ID)], [rice]);
    expect(items.map((item) => (item.type === "recipe" ? item.title : null))).toEqual([
      "김치볶음밥",
      "김치볶음밥",
    ]);
  });

  test("찾지 못한 레시피 항목의 위치를 알리고 그 항목은 바꾸지 않는다", () => {
    const missingSoup = recipeItem(SOUP_ID, { title: "계란국" });
    const { items, missing } = fillRecipeItems(
      [recipeItem(RECIPE_ID), product, missingSoup],
      [rice]
    );
    expect(missing).toEqual([2]);
    expect(items[2]).toBe(missingSoup);
  });

  test("모두 찾으면 찾지 못한 위치가 없다", () => {
    expect(fillRecipeItems([recipeItem(RECIPE_ID), product], [rice]).missing).toEqual([]);
  });

  test("항목이 없으면 빈 목록을 돌려준다", () => {
    expect(fillRecipeItems([], [rice])).toEqual({ items: [], missing: [] });
  });
});
