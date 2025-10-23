// src/app/api/recipes/[id]/route.ts
import { recipeUpdateSchema } from "@/features/recipe/schema";
import * as service from "@/features/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";

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

const badId = () => err(400, "BAD_REQUEST", "유효하지 않은 레시피 ID입니다.");

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

export async function GET(_: Request, { params }: Ctx) {
  try {
    if (!UUID_RE.test(params.id)) return badId();
    const supabase = getServerSupabase();
    const item = await service.getRecipe(supabase, params.id);
    if (!item) return err(404, "NOT_FOUND", "레시피를 찾을 수 없습니다.");
    return json({ data: item }, 200, { "Cache-Control": "no-store" });
  } catch (error) {
    console.error("[recipes][GET] failed", error);
    return err(500, "INTERNAL_ERROR", "서버 처리 중 오류가 발생했습니다.");
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    if (!UUID_RE.test(params.id)) return badId();

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return err(415, "UNSUPPORTED_MEDIA_TYPE", "application/json으로 전송해 주세요.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err(400, "BAD_JSON", "요청 본문(JSON) 파싱에 실패했습니다.");
    }

    const parsed = recipeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return err(400, "VALIDATION_ERROR", "입력값을 확인해 주세요.", parsed.error.flatten());
    }

    const supabase = getServerSupabase();
    const updated = await service.updateRecipe(supabase, params.id, parsed.data);
    return json({ data: updated });
  } catch (error) {
    const mapped = mapAuthError(error);
    if (mapped) return mapped;
    console.error("[recipes][PUT] failed", error);
    return err(500, "INTERNAL_ERROR", "서버 처리 중 오류가 발생했습니다.");
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    if (!UUID_RE.test(params.id)) return badId();
    const supabase = getServerSupabase();

    const existing = await service.getRecipe(supabase, params.id);
    if (!existing) return err(404, "NOT_FOUND", "레시피를 찾을 수 없습니다.");

    await service.removeRecipe(supabase, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    const mapped = mapAuthError(error);
    if (mapped) return mapped;
    console.error("[recipes][DELETE] failed", error);
    return err(500, "INTERNAL_ERROR", "서버 처리 중 오류가 발생했습니다.");
  }
}
