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

    const bookmarked = await readRelationState(req, "bookmarked");
    if (bookmarked === null) return badRequest("bookmarked 값이 필요합니다.");

    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .rpc("set_combo_bookmark", { p_combo_id: params.id, p_bookmarked: bookmarked })
      .maybeSingle();
    if (error) {
      console.error("조합 북마크 처리 실패", error);
      return respondWithSupabaseError(error);
    }
    if (!data) return notFound();

    return json({ bookmarked: data.bookmarked, bookmarkCount: data.bookmark_count });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("조합 북마크 처리 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("조합 북마크 처리 실패", error);
    return internalError();
  }
}
