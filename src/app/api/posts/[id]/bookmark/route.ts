import { isBookmarkedPost } from "@/domain/post/post_bookmark/service";
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

    const bookmarked = await isBookmarkedPost(supabase, params.id, user.id);
    return json({ bookmarked });
  } catch (error) {
    if (isPostgrestError(error)) return respondWithSupabaseError(error);
    console.error("게시글 북마크 상태 조회에 실패했습니다.", error);
    return internalError();
  }
}

export async function POST(_: Request, props: contentParams) {
  const params = await props.params;

  try {
    const supabase = await getServerSupabase();
    const { error: authError } = await AuthErrorHelper();
    if (authError) return authError;

    const { data, error } = await supabase.rpc("toggle_bookmark", {
      p_type: "post",
      p_id: params.id,
    });
    if (error) return respondWithSupabaseError(error);
    if (!data?.[0]) return notFound();

    revalidatePath("/");
    revalidatePath("/posts");
    revalidatePath(`/posts/${params.id}`);

    return json({
      bookmarked: data[0].bookmarked,
      bookmarkCount: data[0].bookmark_count,
    });
  } catch (error) {
    if (isPostgrestError(error)) return respondWithSupabaseError(error);
    console.error("게시글 북마크 처리에 실패했습니다.", error);
    return internalError();
  }
}
