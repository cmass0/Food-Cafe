// src/app/api/recipes/like-meta/route.ts
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LikeMetaResponse = {
  liked: string[];
  counts: Record<string, number>;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (ids.length === 0) {
      return json({ data: { liked: [], counts: {} } satisfies LikeMetaResponse });
    }

    const supabase = getServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[recipes][like-meta] getUser failed", userError);
    }

    // 1) 현재 유저가 좋아요한 recipe_id 집합
    let liked: string[] = [];
    if (user) {
      const { data, error } = await supabase
        .from("user_likes")
        .select("recipe_id")
        .eq("user_id", user.id)
        .in("recipe_id", ids);

      if (error) {
        console.error("[recipes][like-meta] liked select failed", error);
      } else {
        liked = (data ?? []).map((row: any) => String(row.recipe_id));
      }
    }

    // 2) 각 레시피별 총 좋아요 수 (현재 페이지 범위 내에서만)
    const { data: countRows, error: countError } = await supabase
      .from("user_likes")
      .select("recipe_id")
      .in("recipe_id", ids);

    if (countError) {
      console.error("[recipes][like-meta] counts select failed", countError);
      return json(
        {
          error: "INTERNAL_ERROR",
          message: "좋아요 정보를 불러오는 중 오류가 발생했습니다.",
        },
        500
      );
    }

    const counts: Record<string, number> = {};
    for (const row of countRows ?? []) {
      const id = String((row as any).recipe_id);
      counts[id] = (counts[id] ?? 0) + 1;
    }

    return json({ data: { liked, counts } satisfies LikeMetaResponse });
  } catch (error) {
    console.error("[recipes][like-meta] GET failed", error);
    return json(
      { error: "INTERNAL_ERROR", message: "좋아요 정보를 불러오는 중 오류가 발생했습니다." },
      500
    );
  }
}

