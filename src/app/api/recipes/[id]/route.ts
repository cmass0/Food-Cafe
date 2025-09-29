// src/app/api/recipes/[id]/route.ts
import { recipeUpdateSchema } from "@/features/recipe/schema";
import { getServerSupabase } from "@/lib/supabase/server";
import * as service from "@/features/recipe/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const sb = getServerSupabase();
    const item = await service.getRecipe(sb as any, params.id);
    if (!item) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ data: item }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const json = await req.json();
    const parsed = recipeUpdateSchema.safeParse(json);
    if (!parsed.success)
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    const sb = getServerSupabase();
    const updated = await service.updateRecipe(sb as any, params.id, parsed.data);
    if (!updated) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ data: updated });
  } catch {
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const sb = getServerSupabase();
    await service.removeRecipe(sb as any, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[recipes] DELETE failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
