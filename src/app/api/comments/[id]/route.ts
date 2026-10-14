import * as commentService from "@/domain/comment/service";
import { contentParams } from "@/lib/api/prams-type";
import {
  AuthErrorHelper,
  badRequest,
  json,
  notFound,
  respondWithError,
} from "@/lib/errors/api-response";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, props: contentParams) {
  const params = await props.params;
  try {
    const supabase = await getServerSupabase();
    const comment = await commentService.getComment(supabase, params.id);
    if (!comment) {
      return notFound();
    }
    return json({ data: comment });
  } catch (error) {
    return respondWithError(error, "댓글을 가져오는데 실패했습니다.");
  }
}

export async function PUT(req: Request, props: contentParams) {
  const params = await props.params;
  let body;
  const supabase = await getServerSupabase();
  try {
    body = await req.json();
  } catch {
    return badRequest("잘못된 JSON 형식입니다.");
  }

  const { user, error } = await AuthErrorHelper();
  if (error) return error;

  try {
    const updated = await commentService.updateComment(supabase, params.id, user.id, body);
    if (!updated) {
      return notFound();
    }

    return json({ data: updated });
  } catch (error) {
    return respondWithError(error, "댓글 수정에 실패했습니다.");
  }
}

export async function DELETE(_req: Request, props: contentParams) {
  const params = await props.params;
  const supabase = await getServerSupabase();

  const { user, error } = await AuthErrorHelper();
  if (error) return error;
  try {
    const result = await commentService.deleteComment(supabase, params.id, user.id);
    if (!result) {
      return notFound();
    }
    // 갱신된 부모 카운트 + parent 정보 함께 응답 — 클라이언트가 setState로 즉시 갱신
    return json({ data: result }, 200);
  } catch (error) {
    return respondWithError(error, "댓글 삭제에 실패했습니다.");
  }
}
