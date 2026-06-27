import * as commentService from "@/domain/comment/service";
import {
  AuthErrorHelper,
  badRequest,
  internalError,
  isPostgrestError,
  json,
  respondWithSupabaseError,
  validationError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "");
    const pageParam = Number(url.searchParams.get("page") ?? "");
    const parentType = url.searchParams.get("parentType");
    const parentId = url.searchParams.get("parentId");
    const supabase = await getServerSupabase();

    const data = await commentService.listComments(supabase, {
      limit: Number.isFinite(limitParam) ? limitParam : undefined,
      page: Number.isFinite(pageParam) ? pageParam : undefined,
      parentType: parentType as "recipe" | "post" | "combo" | undefined,
      parentId: parentId ?? undefined,
    });
    return json({ data });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("댓글을 가져오는데 실패했습니다.", error);
    return internalError();
  }
}

export async function POST(req: Request) {
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
    const { comment, parentCommentCount } = await commentService.createComment(
      supabase,
      user.id,
      body
    );
    // 새 댓글 + 부모의 갱신된 comment_count를 함께 응답 (like/bookmark와 동일 패턴)
    return json({ data: { comment, parentCommentCount } }, 201);
  } catch (error) {
    if (error instanceof ZodError) {
      return validationError(error.errors);
    }
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("댓글 생성에 실패했습니다.", error);
    return internalError();
  }
}
