// 좋아요 메타 정보 조회: /api/recipes/like?ids=uuid1,uuid2
import { NextResponse } from "next/server";

import { getServerSupabase } from "@/lib/supabase/server";

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id.length > 0);

    if (ids.length === 0) {
      return json({ data: { liked: [], counts: {} } });
    }

    const supabase = getServerSupabase();

    // 현재 사용자 기준 liked 집합
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("[recipes.like.meta] auth error:", authError);
    }
    const userId = auth?.user?.id ?? null;

    let liked: string[] = [];
    if (userId) {
      const { data, error } = await supabase
        .from("user_likes")
        .select("recipe_id")
        .eq("user_id", userId)
        .in("recipe_id", ids);
      if (error) {
        console.error("[recipes.like.meta] liked fetch error:", error);
        return json({ error: "LIKE_META_FAILED" }, 500);
      }
      liked = (data ?? []).map((row) => row.recipe_id as string);
    }

    // recipe_id별 좋아요 카운트
    const { data: rows, error: countError } = await supabase
      .from("user_likes")
      .select("recipe_id")
      .in("recipe_id", ids);
    if (countError) {
      console.error("[recipes.like.meta] count fetch error:", countError);
      return json({ error: "LIKE_META_FAILED" }, 500);
    }
    const counts: Record<string, number> = {};
    (rows ?? []).forEach((row) => {
      const id = row.recipe_id as string;
      counts[id] = (counts[id] ?? 0) + 1;
    });

    return json({ data: { liked, counts } });
  } catch (error) {
    console.error("[recipes.like.meta] GET error:", error);
    return json({ error: "INTERNAL_ERROR" }, 500);
  }
}

