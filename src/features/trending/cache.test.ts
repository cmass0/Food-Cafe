import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

const SUPABASE_URL = "https://project.supabase.co";
const ANON_KEY = "test-anon-key";

type RpcCall = {
  fn: string;
  limit: number;
  period: string;
  authorization: string | null;
};

// 집계 함수가 돌려주는 행. id에 함수 이름과 기간을 넣어 어느 집계 결과인지 구분한다.
function trendingRow(id: string) {
  return {
    id,
    title: id,
    summary: null,
    image: null,
    tags: [],
    like_count: 0,
    bookmark_count: 0,
    comment_count: 0,
    view_count: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    writer_uid: null,
    writer_name: null,
    recent_like_count: 0,
    recent_bookmark_count: 0,
    recent_comment_count: 0,
    recent_participant_count: 0,
    recent_activity_count: 0,
    trend_score: 1,
    last_activity_at: "2026-01-01T00:00:00.000Z",
  };
}

// DB 대신 네트워크 요청을 받아 어떤 집계를 어떤 권한으로 물었는지 기록한다.
function stubDatabase(): RpcCall[] {
  const calls: RpcCall[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const fn = new URL(String(input)).pathname.split("/").pop() ?? "";
      const body = JSON.parse(String(init?.body)) as { p_limit: number; p_period: string };
      calls.push({
        fn,
        limit: body.p_limit,
        period: body.p_period,
        authorization: new Headers(init?.headers).get("Authorization"),
      });
      return new Response(JSON.stringify([trendingRow(`${fn}:${body.p_period}`)]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    })
  );
  return calls;
}

async function loadCache() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ANON_KEY);
  vi.resetModules();
  const cache = await import("./cache");
  // 캐시는 프로세스에 하나라 모듈을 다시 불러와도 남아 있으므로, 테스트마다 비우고 시작한다.
  cache.clearTrendingCache();
  return cache;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("인기 집계 캐시", () => {
  test("같은 종류·개수·기간을 동시에 요청하면 DB에 한 번만 묻는다", async () => {
    const { listCachedTrendingRecipes } = await loadCache();
    const calls = stubDatabase();

    const [first, second] = await Promise.all([
      listCachedTrendingRecipes(4, "week"),
      listCachedTrendingRecipes(4, "week"),
    ]);

    expect(calls).toHaveLength(1);
    expect(first.map((item) => item.id)).toEqual(["get_trending_recipes:week"]);
    expect(second).toEqual(first);
  });

  test("기간이 다르면 따로 집계한다", async () => {
    const { listCachedTrendingRecipes } = await loadCache();
    const calls = stubDatabase();

    const day = await listCachedTrendingRecipes(50, "day");
    const week = await listCachedTrendingRecipes(50, "week");

    expect(calls.map(({ period }) => period)).toEqual(["day", "week"]);
    expect(day.map((item) => item.id)).toEqual(["get_trending_recipes:day"]);
    expect(week.map((item) => item.id)).toEqual(["get_trending_recipes:week"]);
  });

  test("개수가 다르면 따로 집계한다", async () => {
    const { listCachedTrendingRecipes } = await loadCache();
    const calls = stubDatabase();

    await listCachedTrendingRecipes(4, "week");
    await listCachedTrendingRecipes(50, "week");

    expect(calls.map(({ limit }) => limit)).toEqual([4, 50]);
  });

  test("종류가 다르면 같은 개수·기간이어도 따로 집계한다", async () => {
    const { listCachedTrendingRecipes, listCachedTrendingCombos } = await loadCache();
    const calls = stubDatabase();

    const recipes = await listCachedTrendingRecipes(5, "week");
    const combos = await listCachedTrendingCombos(5, "week");

    expect(calls.map(({ fn }) => fn)).toEqual(["get_trending_recipes", "get_trending_combos"]);
    expect(recipes.map((item) => item.resourceType)).toEqual(["recipe"]);
    expect(combos.map((item) => item.resourceType)).toEqual(["combo"]);
  });

  test("집계는 로그인 사용자가 아닌 비로그인 권한으로 묻는다", async () => {
    const { listCachedTrendingPosts } = await loadCache();
    const calls = stubDatabase();

    await listCachedTrendingPosts(4);

    expect(calls).toEqual([
      { fn: "get_trending_posts", limit: 4, period: "week", authorization: `Bearer ${ANON_KEY}` },
    ]);
  });

  test("캐시를 비우면 다음 요청은 다시 집계한다", async () => {
    const { listCachedTrendingRecipeTags, clearTrendingCache } = await loadCache();
    const calls = stubDatabase();

    await listCachedTrendingRecipeTags(6);
    clearTrendingCache();
    await listCachedTrendingRecipeTags(6);

    expect(calls.map(({ fn }) => fn)).toEqual([
      "get_trending_recipe_tags",
      "get_trending_recipe_tags",
    ]);
  });
});
