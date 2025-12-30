import { contentParams } from "@/lib/api/prams-type";
import {
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
    const { data: view_count, error } = await supabase.rpc("increment_combo_view", {
      p_combo_id: params.id,
    });

    if (!view_count) return notFound();

    if (error) return respondWithSupabaseError(error);

    return json({ viewCount: view_count }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 조합 조회수 증가 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 조합 조회수 증가 실패", error);
    return internalError();
  }
}
