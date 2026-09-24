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

// 값이 없거나 비어 있으면 서비스 기본값(1페이지, 기본 개수)을 쓰도록 undefined로 넘긴다.
// Number("")는 0이 되어 "1 이상" 검증에 걸리므로 빈 문자열을 먼저 걸러낸다.
function readOptionalNumber(params: URLSearchParams, key: string): number | undefined {
  const raw = params.get(key)?.trim();
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parentType = url.searchParams.get("parentType");
    const parentId = url.searchParams.get("parentId");
    const supabase = await getServerSupabase();

    const data = await commentService.listComments(supabase, {
      limit: readOptionalNumber(url.searchParams, "limit"),
      page: readOptionalNumber(url.searchParams, "page"),
      parentType: parentType as "recipe" | "post" | "combo" | undefined,
      parentId: parentId ?? undefined,
    });
    return json({ data });
  } catch (error) {
    // page=0, 부모 누락처럼 잘못된 요청은 서버 오류(500)가 아니라 입력 오류(400)로 응답한다.
    if (error instanceof ZodError) {
      return validationError(error.errors);
    }
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
