import { contentParams } from "@/lib/api/prams-type";
import {
  AuthErrorHelper,
  internalError,
  isPostgrestError,
  json,
  notFound,
  respondWithSupabaseError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(_: Request, { params }: contentParams) {
  try {
    const supabase = getServerSupabase();

    const { error } = await AuthErrorHelper();
    if (error) return error;

    const { data: toggled, error: toggleError } = await supabase.rpc("recipe_toggle_like", {
      p_recipe_id: params.id,
    });
    if (toggleError) {
      console.error("레시피 좋아요 rpc 토글 실패", toggleError);
      return respondWithSupabaseError(toggleError);
    }
    if (!toggled || toggled.length === 0) return notFound();

    return json({ like: toggled[0]?.liked, likecount: toggled[0]?.like_count }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 좋아요 토글 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 좋아요 토글 실패", error);
    return internalError();
  }
}
