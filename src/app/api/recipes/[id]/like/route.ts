import { getServerSupabase } from "@/lib/supabase/server";
import { PostgrestError } from "@supabase/supabase-js";

type RouteParams = {
  params: { id: string }; // recipeId
};

const isPostgrestError = (error: unknown): error is PostgrestError =>
  Boolean(error) && typeof (error as PostgrestError)?.code === "string";

const respondWithSupabaseError = (error: PostgrestError) => {
  const status = error.code === "42501" ? 403 : 400;
  return Response.json(
    {
      error: error.code,
      message: error.message,
      details: error.details ?? error.hint,
    },
    { status }
  );
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

    const row = Array.isArray(toggled) ? toggled[0] : (toggled as any);
    const likeCount = (row?.like_count as number | undefined) ?? null;
    const liked = (row?.liked as boolean | undefined) ?? false;

    return Response.json({ liked, likeCount }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("Failed to toggle bookmark", error);
      return respondWithSupabaseError(error);
    }
    console.error("Failed to toggle bookmark", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
