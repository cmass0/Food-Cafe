import { contentParams } from "@/lib/api/prams-type";
import {
  internalError,
  isPostgrestError,
  json,
  notFound,
  respondWithSupabaseError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: Request, props: contentParams) {
  const params = await props.params;
  const supabase = await getServerSupabase();
  try {
    const { data: viewCount, error } = await supabase.rpc("increment_recipe_view", {
      p_recipe_id: params.id,
    });
    if (error) {
      console.error("레시피 조회수 증가 실패", error);
      return respondWithSupabaseError(error);
    }
    if (!viewCount) return notFound();

    return json({ viewCount }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 조합 조회수 증가 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 조합 조회수 증가 실패", error);
    return internalError();
  }
}
