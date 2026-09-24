import { isLikedPost } from "@/domain/post/post_like/service";
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

export async function POST(req: Request, props: contentParams) {
  const params = await props.params;

  try {
    const { error: authError } = await AuthErrorHelper();
    if (authError) return authError;

    const liked = await readRelationState(req, "liked");
    if (liked === null) return badRequest("liked 값이 필요합니다.");

    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .rpc("set_post_like", { p_post_id: params.id, p_liked: liked })
      .maybeSingle();
    if (error) return respondWithSupabaseError(error);
    if (!data) return notFound("게시글");

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath(`/posts/${params.id}`);

    return json({ liked: data.liked, likeCount: data.like_count });
  } catch (error) {
    if (isPostgrestError(error)) return respondWithSupabaseError(error);
    console.error("게시글 좋아요 처리에 실패했습니다.", error);
    return internalError();
  }
}
