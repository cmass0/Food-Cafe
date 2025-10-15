// src/app/api/posts/[id]/route.ts
import { getServerSupabase } from "@/lib/supabase/server";
import { postUpdateSchema } from "@/features/post/schema";
import * as postService from "@/features/post/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  const supabase = getServerSupabase();
  const item = await postService.getPost(supabase, params.id);
  if (!item) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
  return Response.json({ data: item }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const json = await req.json();
    const parsed = postUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const supabase = getServerSupabase();
    const updated = await postService.updatePost(supabase, params.id, parsed.data);
    if (!updated) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ data: updated });
  } catch (error) {
    console.error("[posts] PUT failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const supabase = getServerSupabase();
    await postService.removePost(supabase, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[posts] DELETE failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
