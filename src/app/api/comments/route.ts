import * as commentService from "@/domain/comment/service";
import { CommentInsertInput } from "@/domain/comment/types";
import { isPostgrestError, respondWithSupabaseError } from "@/lib/api/route-error";
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

    const supabase = getServerSupabase();
    const data = await commentService.listComments(supabase, {
      limit: Number.isFinite(limitParam) ? limitParam : undefined,
      page: Number.isFinite(pageParam) ? pageParam : undefined,
      parentType: parentType as "recipe" | "post" | undefined,
      parentId: parentId ?? undefined,
    });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: error.flatten() },
        { status: 400 }
      );
    }
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    const detail = (error as any)?.message ?? String(error);
    console.error("[comments] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR", detail }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = getServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    const body: CommentInsertInput = await req.json();

    if (error) throw error;
    if (!user) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const created = await commentService.createComment(supabase, user.id, body);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: error.flatten() },
        { status: 400 }
      );
    }
    if (isPostgrestError(error)) {
      return respondWithSupabaseError(error);
    }
    const detail = (error as any)?.message ?? String(error);
    console.error("[comments] POST failed", error);
    return Response.json({ error: "INTERNAL_ERROR", detail }, { status: 500 });
  }
}
