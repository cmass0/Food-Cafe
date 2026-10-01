import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, test, vi } from "vitest";

import type { Database } from "@/types/supabase";

import { loadMyReactions, NO_REACTIONS, withMyReactions } from "./service";

const USER_ID = "00000000-0000-4000-8000-000000000001";

type Rows = Record<string, Record<string, string>[]>;

// 좋아요·북마크 테이블마다 "이 사용자가 누른 대상 id" 행을 돌려주는 가짜 클라이언트.
function createClient(rows: Rows, user: { id: string } | null = { id: USER_ID }) {
  const getUser = vi.fn().mockResolvedValue({ data: { user }, error: null });
  const from = vi.fn((table: string) => {
    const query = {
      select: () => query,
      eq: () => query,
      in: (column: string, ids: string[]) =>
        Promise.resolve({
          data: (rows[table] ?? []).filter((row) => ids.includes(row[column] ?? "")),
          error: null,
        }),
    };
    return query;
  });
  return {
    client: { auth: { getUser }, from } as unknown as SupabaseClient<Database>,
    getUser,
    from,
  };
}

describe("loadMyReactions", () => {
  test("대상이 없으면 로그인 확인도 조회도 하지 않는다", async () => {
    const { client, getUser, from } = createClient({});

    await expect(loadMyReactions(client, [])).resolves.toBe(NO_REACTIONS);
    expect(getUser).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  test("비로그인이면 좋아요·북마크를 조회하지 않고 빈 결과를 돌려준다", async () => {
    const { client, from } = createClient({}, null);

    await expect(loadMyReactions(client, [{ type: "recipe", id: "r1" }])).resolves.toBe(
      NO_REACTIONS
    );
    expect(from).not.toHaveBeenCalled();
  });

  test("사용자 id를 넘기면 로그인 확인 요청을 하지 않는다", async () => {
    const { client, getUser } = createClient({ recipe_likes: [{ recipe_id: "r1" }] });

    const reactions = await loadMyReactions(client, [{ type: "recipe", id: "r1" }], USER_ID);

    expect(getUser).not.toHaveBeenCalled();
    expect(reactions.liked.has("recipe:r1")).toBe(true);
  });

  test("같은 id라도 레시피·조합·게시글을 구분해 표시한다", async () => {
    const { client } = createClient({
      recipe_likes: [{ recipe_id: "same" }],
      combo_bookmarks: [{ combo_id: "same" }],
      post_likes: [{ post_id: "p1" }],
      post_bookmarks: [{ post_id: "p1" }],
    });
    const items = [
      { type: "recipe", id: "same" },
      { type: "combo", id: "same" },
      { type: "post", id: "p1" },
      { type: "post", id: "p2" },
    ] as const;

    const reactions = await loadMyReactions(client, [...items]);
    const marked = withMyReactions([...items], (item) => item.type, reactions);

    expect(marked.map(({ type, id, liked, bookmarked }) => [type, id, liked, bookmarked])).toEqual([
      ["recipe", "same", true, false],
      ["combo", "same", false, true],
      ["post", "p1", true, true],
      ["post", "p2", false, false],
    ]);
  });

  test("조회가 실패하면 페이지를 깨뜨리지 않고 빈 결과를 돌려준다", async () => {
    const { client, from } = createClient({});
    from.mockImplementation(() => {
      throw new Error("DB 연결 실패");
    });
    vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(loadMyReactions(client, [{ type: "combo", id: "c1" }])).resolves.toBe(
      NO_REACTIONS
    );
    vi.restoreAllMocks();
  });
});

describe("withMyReactions", () => {
  test("반응 조회 결과가 없으면 모든 항목을 누르지 않은 것으로 표시한다", () => {
    expect(withMyReactions([{ id: "r1", title: "김치찌개" }], "recipe", NO_REACTIONS)).toEqual([
      { id: "r1", title: "김치찌개", liked: false, bookmarked: false },
    ]);
  });
});
