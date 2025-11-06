import { getServerSupabase } from "@/lib/supabase/server";
import * as commentService from "@/features/comment/service";

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

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

}

export async function DELETE(req: Request, { params }: Ctx) {}

