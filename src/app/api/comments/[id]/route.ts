import * as commentService from "@/domain/comment/service";
import { contentParams } from "@/lib/api/prams-type";
import {
  AuthErrorHelper,
  badRequest,
  internalError,
  isPostgrestError,
  json,
  notFound,
  respondWithSupabaseError,
  validationError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

import { ZodError } from "zod";

export const runtime = "nodejs";
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
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("댓글을 가져오는데 실패했습니다.", error);
    return internalError();
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
    const updated = await commentService.updateComment(supabase, params.id, body);
    if (!updated) {
      return notFound();
    }

    return json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error);
    }
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("댓글 수정에 실패했습니다.", error);
    return internalError();
  }
}

export async function DELETE(_req: Request, props: contentParams) {
  const params = await props.params;
  const supabase = await getServerSupabase();

  const { user, error } = await AuthErrorHelper();
  if (error) return error;
  try {
    await commentService.deleteComment(supabase, params.id);
    return json({ message: "댓글이 삭제되었습니다." }, 200);
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("댓글 삭제에 실패했습니다.", error);
    return internalError();
  }
}
