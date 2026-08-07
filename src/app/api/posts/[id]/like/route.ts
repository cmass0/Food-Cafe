import { isLikedPost } from "@/domain/post/post_like/service";
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
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: Request, props: contentParams) {
  const params = await props.params;

  try {
    const supabase = await getServerSupabase();
    const { user, error } = await AuthErrorHelper();
    if (error) return error;

    const liked = await isLikedPost(supabase, params.id, user.id);
    return json({ liked });
  } catch (error) {
    if (isPostgrestError(error)) return respondWithSupabaseError(error);
    console.error("게시글 좋아요 상태 조회에 실패했습니다.", error);
    return internalError();
  }
}

export async function POST(_: Request, props: contentParams) {
  const params = await props.params;

  try {
    const supabase = await getServerSupabase();
    const { error } = await AuthErrorHelper();
    if (error) return error;

    const { data, error: toggleError } = await supabase.rpc("post_toggle_like", {
      p_post_id: params.id,
    });
    if (toggleError) return respondWithSupabaseError(toggleError);
    if (!data?.[0]) return notFound();

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath(`/posts/${params.id}`);

    return json({ liked: data[0].liked, likeCount: data[0].like_count });
  } catch (error) {
    if (isPostgrestError(error)) return respondWithSupabaseError(error);
    console.error("게시글 좋아요 처리에 실패했습니다.", error);
    return internalError();
  }
}
