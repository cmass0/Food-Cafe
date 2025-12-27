import * as commentService from "@/domain/comment/service";
import { getServerSupabase } from "@/lib/supabase/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const supabase = getServerSupabase();
    const comment = await commentService.getComment(supabase, params.id);
    if (!comment) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return Response.json({ data: comment }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[comments/:id] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: RouteContext) {
  try {
    const supabase = getServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json();
    const updated = await commentService.updateComment(supabase, params.id, body);
    if (!updated) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }

    return Response.json({ data: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: error.flatten() },
        { status: 400 }
      );
    }
    console.error("[comments/:id] PUT failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  try {
    const supabase = getServerSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) {
      return Response.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }

    await commentService.deleteComment(supabase, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[comments/:id] DELETE failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
