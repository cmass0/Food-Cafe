import { postUpdateSchema } from "@/domain/post/schema";
import * as postService from "@/domain/post/service";
import { clearTrendingCache } from "@/features/trending/cache";
import { contentParams } from "@/lib/api/prams-type";
import {
  AuthErrorHelper,
  badRequest,
  json,
  notFound,
  respondWithError,
  validationError,
} from "@/lib/errors/api-response";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(_: Request, props: contentParams) {
  const params = await props.params;
  try {
    const supabase = await getServerSupabase();
    const item = await postService.getPost(supabase, params.id);
    if (!item) return notFound("해당 게시글을 찾을 수 없습니다.");

    return json({ data: item });
  } catch (error) {
    return respondWithError(error, "게시글을 가져오지 못했습니다");
  }
}

export async function PUT(req: Request, props: contentParams) {
  const params = await props.params;
  const supabase = await getServerSupabase();
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("잘못된 JSON 형식입니다.");
    }

    const parsed = postUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { user, error } = await AuthErrorHelper();
    if (error) {
      return error;
    }

    const updated = await postService.updatePost(supabase, params.id, user.id, parsed.data);
    if (!updated) return notFound("해당 게시글을 찾을 수 없습니다.");

    return json({ data: updated });
  } catch (error) {
    return respondWithError(error, "게시글을 수정에 실패하였습니다.");
  }
}

export async function DELETE(_: Request, props: contentParams) {
  const params = await props.params;
  try {
    const supabase = await getServerSupabase();
    const { error } = await AuthErrorHelper();
    if (error) {
      return error;
    }
    const deleted = await postService.removePost(supabase, params.id);
    if (!deleted) return notFound("삭제할 수 있는 게시글");
    clearTrendingCache();
    return json({ message: "게시글이 삭제되었습니다." }, 200);
  } catch (error) {
    return respondWithError(error, "게시글 삭제에 실패하였습니다.");
  }
}
