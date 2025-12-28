import { isPostgrestError, respondWithSupabaseError } from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

type RouteParams = {
  params: { id: string }; // recipeId
};


export async function POST(_req: Request, { params }: RouteParams) {
  try {
    const recipeId = params.id;
    const supabase = getServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return Response.json(
        { error: "UNAUTHENTICATED" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const { data: toggled, error: toggleError } = await supabase.rpc("recipe_toggle_like", {
      p_recipe_id: recipeId,
    });
    if (toggleError) {
      console.error("[recipes.like] rpc error:", toggleError);
      return respondWithSupabaseError(toggleError);
    }

    const row = Array.isArray(toggled) ? toggled[0] : toggled;
    const likeCount = row?.like_count ?? null;
    const liked = row?.liked ?? false;

    return Response.json({ liked, likeCount }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("Failed to toggle like", error);
      return respondWithSupabaseError(error);
    }
    console.error("Failed to toggle like", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
