import { getServerSupabase } from "@/lib/supabase/server";
import * as commentService from "@/features/comment/service";
import { commentUpdateSchema } from "@/features/comment/schema";

export const runtime = "nodejs";  
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(headers || {}) },
  });

const err = (status: number, code: string, message?: string, details?: unknown) =>
  json({ error: code, message, details }, status);

const badId = () => err(400, "BAD_REQUEST", "유효하지 않은 게시글 ID입니다.");

const mapAuthError = (error: unknown) => {
  const message = String((error as any)?.message ?? "").toLowerCase();
  if (message.includes("로그인") || message.includes("unauthorized") || message.includes("login")) {
    return err(401, "UNAUTHORIZED", "로그인이 필요합니다.");
  }
  if (
    message.includes("permission denied") ||
    message.includes("forbidden") ||
    message.includes("rls")
  ) {
    return err(403, "FORBIDDEN", "권한이 없습니다.");
  }
  return null;
};

export async function GET(_req: Request, { params }: Ctx) {
  try {
    
    const { id } = params;
    const supabase = getServerSupabase();
    const item = await commentService.getComment(supabase, id);
    if (!item) { err(404, "NOT_FOUND", "게시글을 찾을 수 없습니다.");Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return Response.json({ data: item }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[comments] GET failed", error);
    return err(500, "INTERNAL_ERROR", "서버 처리 중 오류가 발생했습니다.");
  }     
}

export async function PUT(req: Request, { params }: Ctx) {
  try{
    if (!UUID_RE.test(params.id)) return badId();
      const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return err(415, "UNSUPPORTED_MEDIA_TYPE", "application/json으로 전송해 주세요.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch (e) {
      return err(400, "BAD_REQUEST", "유효하지 않은 JSON 형식입니다.");
    }
    const parsed = commentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return err(400, "BAD_REQUEST", "유효하지 않은 요청입니다.", parsed.error.format());
    }
      const {id} = params;
      const supabase = getServerSupabase();
      const updated = await commentService.updateComment(supabase, id, body);
      if(!updated){
        return err(404, "NOT_FOUND", "댓글을 찾을 수 없습니다.");
      }
      return json({ data: updated });
  }catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    console.error("[comments] PUT failed", error);
    return err(500, "INTERNAL_ERROR", "서버 처리 중 오류가 발생했습니다.");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  try{
    if (!UUID_RE.test(params.id)) return badId();
      const {id} = params;
      const supabase = getServerSupabase();
      await commentService.deleteComment(supabase, id);
      return new Response(null, { status: 204 });
  }catch (error) {
    const authErr = mapAuthError(error);
    if (authErr) return authErr;
    console.error("[comments] DELETE failed", error);
    return err(500, "INTERNAL_ERROR", "서버 처리 중 오류가 발생했습니다.");
  }
}

