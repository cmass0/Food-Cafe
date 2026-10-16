import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getRecipesByIds } from "./service";

const RICE = "f76c7a5f-8e6d-58aa-826a-5752329b215c";
const SOUP = "7098f58b-d7be-5c00-aca8-1a083cf6c2f0";

function row(id: string, title: string) {
  return {
    id,
    title,
    summary: null,
    image: null,
    images: [],
    steps: [],
    ingredients: [],
    tags: [],
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "2026-10-01T00:00:00Z",
  };
}

// DB처럼 UUID를 대소문자 구분 없이 찾고, 돌려줄 때는 소문자로 준다.
function createClient(rows: ReturnType<typeof row>[]) {
  const client = {
    from: () => ({
      select: () => ({
        in: async (_column: string, ids: string[]) => ({
          data: rows.filter((item) => ids.some((id) => id.toLowerCase() === item.id)),
          error: null,
        }),
      }),
    }),
  } as unknown as SupabaseClient<Database>;
  return client;
}

describe("getRecipesByIds", () => {
  test("요청한 ID 순서대로 레시피를 돌려준다", async () => {
    const recipes = await getRecipesByIds(createClient([row(RICE, "볶음밥"), row(SOUP, "국")]), [
      SOUP,
      RICE,
    ]);
    expect(recipes.map((recipe) => recipe.title)).toEqual(["국", "볶음밥"]);
  });

  test("대문자가 섞인 ID로 요청해도 DB가 찾은 레시피를 빠뜨리지 않는다", async () => {
    const recipes = await getRecipesByIds(createClient([row(RICE, "볶음밥")]), [
      RICE.toUpperCase(),
    ]);
    expect(recipes.map((recipe) => recipe.id)).toEqual([RICE]);
  });

  test("찾지 못한 ID는 빼고 돌려준다", async () => {
    const recipes = await getRecipesByIds(createClient([row(RICE, "볶음밥")]), [RICE, SOUP]);
    expect(recipes.map((recipe) => recipe.id)).toEqual([RICE]);
  });

  test("요청한 ID가 없으면 빈 목록을 돌려준다", async () => {
    expect(await getRecipesByIds(createClient([row(RICE, "볶음밥")]), [])).toEqual([]);
  });
});
