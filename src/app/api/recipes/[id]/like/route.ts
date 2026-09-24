import { contentParams } from "@/lib/api/prams-type";
import { readRelationState } from "@/lib/api/relation-state";
import {
  AuthErrorHelper,
  badRequest,
  internalError,
  isPostgrestError,
  json,
  notFound,
  respondWithSupabaseError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request, props: contentParams) {
  const params = await props.params;
  try {
    const { error: authError } = await AuthErrorHelper();
    if (authError) return authError;

    const liked = await readRelationState(req, "liked");
    if (liked === null) return badRequest("liked 값이 필요합니다.");

    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .rpc("set_recipe_like", { p_recipe_id: params.id, p_liked: liked })
      .maybeSingle();
    if (error) {
      console.error("레시피 좋아요 처리 실패", error);
      return respondWithSupabaseError(error);
    }
    if (!data) return notFound("레시피");

    return json({ liked: data.liked, likeCount: data.like_count });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 좋아요 처리 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 좋아요 처리 실패", error);
    return internalError();
  }
}
