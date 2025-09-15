// src/app/api/recipes/[id]/route.ts
import { RecipeUpdateSchema } from "@/features/recipe/types";
import * as repo from "@/features/recipe/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: { id: string } };

export async function GET(_: Request, { params }: Ctx) {
  try {
    const item = await repo.getRecipe(params.id);
    if (!item) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ data: item }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const json = await req.json();
    const parsed = RecipeUpdateSchema.safeParse(json);
    if (!parsed.success)
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );

    const updated = await repo.updateRecipe(params.id, parsed.data);
    if (!updated) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    return Response.json({ data: updated });
  } catch {
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: Ctx) {
  try {
    await repo.deleteRecipe(params.id);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

