import { isBookmarkedRecipe } from "@/domain/recipe/recipe_bookmark/service";
import { isLikedRecipe } from "@/domain/recipe/recipe_like/service";
import { contentParams } from "@/lib/api/prams-type";
import {
  AuthErrorHelper,
  internalError,
  isPostgrestError,
  json,
  respondWithSupabaseError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: contentParams) {
  try {
    const supabase = getServerSupabase();
    const { user, error: autherror } = await AuthErrorHelper();
    if (autherror) return autherror;

    const [liked, bookmarked] = await Promise.all([
      isLikedRecipe(supabase, params.id, user.id),
      isBookmarkedRecipe(supabase, user.id, params.id),
    ]);

    return json({ liked, bookmarked }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 상태 조회 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 상태 조회 실패", error);
    return internalError();
  }
}
