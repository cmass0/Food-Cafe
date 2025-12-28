// src/app/api/users/[id]/route.ts
// Current implementation enforces a self-only policy. Extend with role checks when needed.

import { UserUpdateSchema } from "@/domain/user/schema";
import * as userService from "@/domain/user/service";
import { isPostgrestError, respondWithSupabaseError } from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...(headers || {}) },
  });

async function AuthErrorHelper(id?: string) {
  const {
    data: { user },
    error,
  } = await getServerSupabase().auth.getUser();
  if (error) throw error;
  if (!user) return json({ error: "UNAUTHORIZED", status: 401 });
  if (user.id !== id) return json({ error: "FORBIDDEN", status: 403 });
  return null;
}

const err = (status: number, code: string, message?: string, details?: unknown) =>
  json({ error: code, message, details }, status);

export async function GET(_: Request, { params }: Ctx) {
  try {
    await AuthErrorHelper(params.id);
    const user = await userService.getUserById(params.id);

    return json({ data: user }, 200, { "Cache-Control": "no-store" });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    console.error("[users][GET] failed", error);
    return err(500, "INTERNAL_ERROR");
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return json({
        error: "UNSUPPORTED_MEDIA_TYPE",
        status: 415,
        message: "application/json is required.",
      });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "BAD_JSON", status: 400, message: "Invalid JSON body." });
    }

    const parsed = UserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return json({
        error: "VALIDATION_ERROR",
        status: 400,
        message: "Validation failed.",
        details: parsed.error.flatten(),
      });
    }

    const supabase = getServerSupabase();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[users][PUT] auth failed", authError);
      return err(500, "INTERNAL_ERROR", "An unexpected error occurred.");
    }
    if (!authUser) return err(401, "UNAUTHORIZED", "Unauthorized access.");
    if (authUser.id !== params.id) return err(403, "FORBIDDEN", "Forbidden access.");

    const updated = await userService.updateSelf(parsed.data);
    return json({ data: updated });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }

    console.error("[users][PUT] failed", error);
    return err(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const supabase = getServerSupabase();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[users][DELETE] auth failed", authError);
      return err(500, "INTERNAL_ERROR", "An unexpected error occurred.");
    }
    if (!authUser) return err(401, "UNAUTHORIZED", "Unauthorized access.");
    if (authUser.id !== params.id) return err(403, "FORBIDDEN", "Forbidden access.");

    await userService.deleteUserById();
    return new Response(null, { status: 204 });
  } catch (error) {
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }

    console.error("[users][DELETE] failed", error);
    return err(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  }
}
