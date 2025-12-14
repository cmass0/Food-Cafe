// src/app/api/recipes/[id]/like/route.ts
import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

import * as userLikeService from "@/features/user_like/service";

type RouteParams = {
  params: { id: string }; // recipeId
};

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const recipeId = params.id;
    const supabase = getServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const currentlyLiked = body.currentlyLiked;

    const result = await userLikeService.toggleRecipeLike(supabase, {
      userId: user.id,
      recipeId,
      currentlyLiked,
    });


    const delta = result ? 1 : -1;
    const { data: adjusted, error: adjustError } = await supabase.rpc("recipe_adjust_like", {
      p_recipe_id: recipeId,
      p_delta: delta,
    });
    if (adjustError) {
      console.error("[recipes.like] rpc error:", adjustError);
      return NextResponse.json({ error: "LIKE_ADJUST_FAILED" }, { status: 500 });
    }

    const likeCount = Array.isArray(adjusted)
      ? (adjusted[0]?.like_count as number | undefined) ?? null
      : (adjusted as any)?.like_count ?? null;

    return NextResponse.json({ liked: result, likeCount });
  } catch (error) {
    console.error("[recipes.like] POST error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
