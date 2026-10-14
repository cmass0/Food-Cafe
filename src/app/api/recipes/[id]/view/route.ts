import { contentParams } from "@/lib/api/prams-type";
import { json, notFound, respondWithError } from "@/lib/errors/api-response";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(_: Request, props: contentParams) {
  const params = await props.params;
  const supabase = await getServerSupabase();
  try {
    const { data: viewCount, error } = await supabase.rpc("increment_recipe_view", {
      p_recipe_id: params.id,
    });
    if (error) throw error;
    if (!viewCount) return notFound();

    return json({ viewCount }, 200);
  } catch (error) {
    return respondWithError(error, "레시피 조회수 증가 실패");
  }
}
