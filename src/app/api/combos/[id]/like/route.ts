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
  const supabase = getServerSupabase();
  try {
    const { error: autherror } = await AuthErrorHelper();
    if (autherror) return autherror;

    const { data: toggled, error } = await supabase.rpc("combo_toggle_like", {
      p_combo_id: params.id,
    });
    if (error) {
      console.error("레시피 좋아요 토글 실패", error);
      return respondWithSupabaseError(error);
    }

    if (!toggled || toggled.length === 0 || !toggled[0]) return notFound();

    return json({ liked: toggled[0].liked, likeCount: toggled[0].like_count }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 좋아요 토글 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 좋아요 토글 실패", error);
    return internalError();
  }
}
