// src/app/api/posts/[id]/route.ts
import { postUpdateSchema } from "@/domain/post/schema";
import * as postService from "@/domain/post/service";
import { isPostgrestError, respondWithSupabaseError } from "@/lib/api/route-error";
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

const badId = () => err(400, "BAD_REQUEST", "invalid post ID.");

const mapAuthError = (error: unknown) => {
  const message = String((error as any)?.message ?? "").toLowerCase();
  if (
    message.includes("unauthorized") ||
    message.includes("unauthorized") ||
    message.includes("login")
  ) {
    return err(401, "UNAUTHORIZED", "Unauthorized access.");
  }
  if (
    message.includes("permission denied") ||
    message.includes("forbidden") ||
    message.includes("rls")
  ) {
    return err(403, "FORBIDDEN", "Forbidden access.");
  }
  return null;
};

export async function GET(_: Request, { params }: Ctx) {
  try {
    if (!UUID_RE.test(params.id)) return badId();
    const supabase = getServerSupabase();
    const item = await postService.getPost(supabase, params.id);
    if (!item) return err(404, "NOT_FOUND", "Post not found.");
    return json({ data: item }, 200, { "Cache-Control": "no-store" });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("[posts][GET] failed", error);
    return err(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    if (!UUID_RE.test(params.id)) return badId();

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return err(415, "UNSUPPORTED_MEDIA_TYPE", "application/json is required.");
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return err(400, "BAD_JSON", "Invalid JSON body.");
    }

    const parsed = postUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return err(400, "VALIDATION_ERROR", "Validation failed.", parsed.error.flatten());
    }

    const supabase = getServerSupabase();
    const updated = await postService.updatePost(supabase, params.id, parsed.data);
    if (!updated) return err(404, "NOT_FOUND", "Post not found.");

    return json({ data: updated });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    const mapped = mapAuthError(error);
    if (mapped) return mapped;
    console.error("[posts][PUT] failed", error);
    return err(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    if (!UUID_RE.test(params.id)) return badId();
    const supabase = getServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("[posts][PUT] session user:", user?.id);
    const existing = await postService.getPost(supabase, params.id);
    if (!existing) return err(404, "NOT_FOUND", "Post not found.");

    await postService.removePost(supabase, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    const mapped = mapAuthError(error);
    if (mapped) return mapped;
    console.error("[posts][DELETE] failed", error);
    return err(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
}
