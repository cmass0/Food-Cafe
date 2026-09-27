import { contentParams } from "@/lib/api/prams-type";
import { internalError, json, respondWithSupabaseError } from "@/lib/errors/api-response";
import { isPostgrestError } from "@/lib/errors/supabase";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(_: Request, props: contentParams) {
  const params = await props.params;
  try {
    const supabase = await getServerSupabase();
    const { data: view_count, error } = await supabase.rpc("increment_post_view", {
      p_post_id: params.id,
    });
    if (error) {
      if (isPostgrestError(error)) {
        return respondWithSupabaseError(error);
      }
      console.error("게시글 조회수 증가에 실패하였습니다.", error);
      return internalError();
    }

    return json({ viewCount: view_count }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("게시글 조회수 처리에 실패하였습니다.", error);
    return internalError();
  }
}
