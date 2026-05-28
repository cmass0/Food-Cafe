import { isBookmarkedCombo } from "@/domain/combo/combo_bookmark/service";
import { isLikedCombo } from "@/domain/combo/combo_like/service";
import { contentParams } from "@/lib/api/prams-type";
import {
  AuthErrorHelper,
  internalError,
  isPostgrestError,
  json,
  respondWithSupabaseError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, props: contentParams) {
  const params = await props.params;
  try {
    const supabase = await getServerSupabase();
    const { user, error: autherror } = await AuthErrorHelper();
    if (autherror) return autherror;

    const [liked, bookmarked] = await Promise.all([
      isLikedCombo(supabase, params.id, user.id),
      isBookmarkedCombo(supabase, user.id, params.id),
    ]);

    return json({ liked, bookmarked: bookmarked }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 조합 상태 조회 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 조합 상태 조회 실패", error);
    return internalError();
  }
}
