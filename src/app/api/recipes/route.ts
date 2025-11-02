import { recipeInsertSchema } from "@/features/recipe/schema";
import * as service from "@/features/recipe/service";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? "20");
    const limit = Number.isFinite(limitParam) ? limitParam : 20;
    const pageParam = Number(url.searchParams.get("page") ?? "");
    const offsetParam = Number(url.searchParams.get("offset") ?? "");
    const page = Number.isFinite(pageParam) ? pageParam : undefined;
    const offset = Number.isFinite(offsetParam) ? offsetParam : undefined;
    const writerUid = url.searchParams.get("writerUid") ?? undefined;

    const supabase = getServerSupabase();
    const data = await service.listRecipes(supabase, { limit, page, offset, writerUid });
    return Response.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("/api/recipes GET failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = recipeInsertSchema.safeParse(json);
    if (!parsed.success) {
      return Response.json(
        { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = getServerSupabase();
    const created = await service.createRecipe(supabase, parsed.data);
    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error("/api/recipes POST failed", error);
    return Response.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

