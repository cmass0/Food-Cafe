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

export async function POST(req: Request, { params }: contentParams) {
  const supabase = getServerSupabase();

  try {
    const { error: autherror } = await AuthErrorHelper();
    if (autherror) return autherror;

    const { data: bookmarkdata, error } = await supabase.rpc("toggle_bookmark", {
      p_type: "recipe",
      p_id: params.id,
    });

    if (error) {
      console.error("북마크 토글 실패", error);
      return respondWithSupabaseError(error);
    }

    if (!bookmarkdata || bookmarkdata.length === 0) return notFound();

    return json({ bookmarked: bookmarkdata[0]?.bookmarked });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("북마크 토글 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("북마크 토글 실패", error);
    return internalError();
  }
}
