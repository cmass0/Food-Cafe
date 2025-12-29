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
      p_type: "combo",
      p_id: params.id,
    });

    if (!bookmarkdata || bookmarkdata.length === 0) return notFound();

    if (error) return respondWithSupabaseError(error);
    return json(
      { bookmarked: bookmarkdata[0]?.bookmarked, bookmarkcount: bookmarkdata[0]?.bookmark_count },
      200
    );
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 조합 조회수 증가 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 조합 조회수 증가 실패", error);
    return internalError();
  }
}
