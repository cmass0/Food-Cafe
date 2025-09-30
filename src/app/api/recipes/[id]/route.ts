import { recipeUpdateSchema } from "@/features/recipe/schema";
import * as service from "@/features/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const supabase = getServerSupabase();
    const item = await service.getRecipe(supabase, params.id);
    if (!item) {
      return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return Response.json({ data: item }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("/api/recipes/[id] GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const json = await req.json();
    const parsed = recipeUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const updated = await service.updateRecipe(supabase, params.id, parsed.data);
    return Response.json({ data: updated });
  } catch (error) {
    console.error("/api/recipes/[id] PUT failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    const supabase = getServerSupabase();
    await service.removeRecipe(supabase, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("/api/recipes/[id] DELETE failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

