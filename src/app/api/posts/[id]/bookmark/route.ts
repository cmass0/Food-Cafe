import { isBookmarkedPost } from "@/domain/post/post_bookmark/service";
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

    const bookmarked = await isBookmarkedPost(supabase, params.id, user.id);
    return json({ bookmarked });
  } catch (error) {
    if (isPostgrestError(error)) return respondWithSupabaseError(error);
    console.error("게시글 북마크 상태 조회에 실패했습니다.", error);
    return internalError();
  }
}

export async function POST(req: Request, props: contentParams) {
  const params = await props.params;

  try {
    const { error: authError } = await AuthErrorHelper();
    if (authError) return authError;

    const bookmarked = await readRelationState(req, "bookmarked");
    if (bookmarked === null) return badRequest("bookmarked 값이 필요합니다.");

    const supabase = await getServerSupabase();
    const { data, error } = await supabase
      .rpc("set_post_bookmark", { p_post_id: params.id, p_bookmarked: bookmarked })
      .maybeSingle();
    if (error) return respondWithSupabaseError(error);
    if (!data) return notFound("게시글");

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath(`/posts/${params.id}`);

    return json({ bookmarked: data.bookmarked, bookmarkCount: data.bookmark_count });
  } catch (error) {
    if (isPostgrestError(error)) return respondWithSupabaseError(error);
    console.error("게시글 북마크 처리에 실패했습니다.", error);
    return internalError();
  }
}
