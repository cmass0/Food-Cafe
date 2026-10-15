import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { SupabaseClient } from "@supabase/supabase-js";
import { ZodError } from "zod";
import type { Database } from "@/types/supabase";
import { COMBO_RECIPE_REFERENCE_ERRORS } from "./messages";
import { createCombo, toArrayItems, toArraySteps, updateCombo } from "./service";
import type { ComboInsertDb } from "./types";

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

const RECIPE_ID = "00000000-0000-4000-8000-000000000001";
const SOUP_ID = "00000000-0000-4000-8000-000000000002";
const COMBO_ID = "00000000-0000-4000-8000-0000000000c1";
const WRITER = "00000000-0000-4000-8000-0000000000a1";

function recipeRow(id: string, title: string) {
  return {
    id,
    title,
    summary: `${title} 설명`,
    image: `https://example.com/${id}.jpg`,
    images: [],
    steps: [],
    ingredients: [],
    tags: [],
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  };
}

// 레시피 조회는 recipeRows를 돌려주고, 조합 쓰기는 보낸 값을 기록한 뒤 실패로 끝낸다.
// 쓰기 뒤의 추천 문서 동기화까지 가지 않고 "무엇을 저장하려 했는지"만 본다.
function createClient(recipeRows: unknown[]) {
  const writes: { table: string; payload: unknown }[] = [];
  const failedWrite = { data: null, error: { code: "XX000", message: "test stop" } };
  const chain = (result: unknown) => {
    const query: Record<string, unknown> = {};
    for (const method of ["select", "eq", "in", "single", "maybeSingle"]) {
      query[method] = () => query;
    }
    query.then = (resolve: (value: unknown) => unknown) => resolve(result);
    return query;
  };
  const client = {
    from(table: string) {
      if (table === "recipes") return chain({ data: recipeRows, error: null });
      return {
        insert: (payload: unknown) => (writes.push({ table, payload }), chain(failedWrite)),
        update: (payload: unknown) => (writes.push({ table, payload }), chain(failedWrite)),
      };
    },
  } as unknown as SupabaseClient<Database>;
  return { client, writes };
}

function comboInput(items: ComboInsertDb["items"]): ComboInsertDb {
  return {
    id: COMBO_ID,
    title: "한 끼",
    steps: [{ description: "함께 낸다." }],
    items,
    difficulty: "쉬움",
    time_minutes: 10,
    writer_uid: WRITER,
  } as ComboInsertDb;
}

const sentItems: ComboInsertDb["items"] = [
  { type: "recipe", recipeid: RECIPE_ID, title: "가짜 제목", summary: "가짜 설명" },
  { type: "recipe", recipeid: SOUP_ID },
];

describe("조합 저장의 레시피 항목", () => {
  test("만들 때 레시피 항목은 브라우저가 보낸 값 대신 DB의 레시피 제목·설명·사진으로 저장한다", async () => {
    const { client, writes } = createClient([
      recipeRow(RECIPE_ID, "김치볶음밥"),
      recipeRow(SOUP_ID, "계란국"),
    ]);
    await expect(createCombo(client, comboInput(sentItems))).rejects.toMatchObject({
      message: "test stop",
    });
    expect(writes).toHaveLength(1);
    expect((writes[0]?.payload as { items: unknown }).items).toEqual([
      {
        type: "recipe",
        recipeid: RECIPE_ID,
        title: "김치볶음밥",
        summary: "김치볶음밥 설명",
        image: `https://example.com/${RECIPE_ID}.jpg`,
      },
      {
        type: "recipe",
        recipeid: SOUP_ID,
        title: "계란국",
        summary: "계란국 설명",
        image: `https://example.com/${SOUP_ID}.jpg`,
      },
    ]);
  });

  test("만들 때 찾지 못한 레시피가 있으면 그 칸의 오류로 거부하고 조합을 쓰지 않는다", async () => {
    const { client, writes } = createClient([recipeRow(RECIPE_ID, "김치볶음밥")]);
    const error = await createCombo(client, comboInput(sentItems)).catch((cause) => cause);
    expect(error).toBeInstanceOf(ZodError);
    expect((error as ZodError).issues).toEqual([
      {
        code: "custom",
        path: ["items", 1, "recipeid"],
        message: COMBO_RECIPE_REFERENCE_ERRORS.notFound,
      },
    ]);
    expect(writes).toEqual([]);
  });

  test("고칠 때 찾지 못한 레시피가 있으면 그 칸의 오류로 거부하고 조합을 쓰지 않는다", async () => {
    const { client, writes } = createClient([]);
    const error = await updateCombo(client, COMBO_ID, WRITER, { items: sentItems }).catch(
      (cause) => cause
    );
    expect((error as ZodError).issues.map((issue) => issue.path)).toEqual([
      ["items", 0, "recipeid"],
      ["items", 1, "recipeid"],
    ]);
    expect(writes).toEqual([]);
  });

  test("고칠 때도 레시피 항목은 DB의 레시피 값으로 저장한다", async () => {
    const { client, writes } = createClient([
      recipeRow(RECIPE_ID, "김치볶음밥"),
      recipeRow(SOUP_ID, "계란국"),
    ]);
    await updateCombo(client, COMBO_ID, WRITER, { items: sentItems }).catch(() => null);
    expect(
      (writes[0]?.payload as { items: { title?: string }[] }).items.map((item) => item.title)
    ).toEqual(["김치볶음밥", "계란국"]);
  });
});
