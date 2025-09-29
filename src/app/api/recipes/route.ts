// src/app/api/recipes/route.ts
import { RecipeCreateSchema } from "@/features/recipe/types";
import * as repo from "@/features/recipe/repository.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitParam) ? limitParam : 20;
    const cursor = url.searchParams.get("cursor") ?? undefined;
    const writerUid = url.searchParams.get("writerUid") ?? undefined;

    const data = await repo.listRecipes({ limit, cursor, writerUid });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("/api/recipes GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = RecipeCreateSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await repo.createRecipe(parsed.data);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("/api/recipes POST failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
