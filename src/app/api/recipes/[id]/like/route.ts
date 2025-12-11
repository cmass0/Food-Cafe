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

    const body = await req.json().catch(() => ({}));
    const currentlyLiked = Boolean(body.currentlyLiked);

    const result = await userLikeService.toggleRecipeLike(supabase, {
      userId: user.id,
      recipeId,
      currentlyLiked,
    });

    return NextResponse.json({ liked: result.liked });
  } catch (error) {
    console.error("[recipes.like] POST error:", error);
    return NextResponse.json(
      { error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}