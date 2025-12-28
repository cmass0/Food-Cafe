import { requestRecipeSchema } from "@/domain/recipe/schema";
import * as recipeService from "@/domain/recipe/service";
import {
  isPostgrestError,
  respondWithSupabaseError,
  serializeUnknownError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit") ?? undefined);
    const pageParam = Number(url.searchParams.get("page") ?? undefined);
    const limit = Number.isFinite(limitParam) ? limitParam : undefined;
    const page = Number.isFinite(pageParam) ? pageParam : undefined;
    const writerUid = url.searchParams.get("writerUid") ?? undefined;
    const tags = url.searchParams.getAll("tag");
    const tagArray = tags.length ? tags : undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const supabase = getServerSupabase();
    const recipes = await recipeService.listRecipes(supabase, {
      limit,
      page,
      writerUid,
      tags: tagArray,
      search,
    });

    return Response.json({ data: recipes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("Failed to get recipe", error);
      return respondWithSupabaseError(error);
    }
    const info = serializeUnknownError(error);
    console.error("Failed to get recipe", info, error);
    return Response.json(
      { error: "Failed to get recipe", details: info },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestRecipeSchema.parse(body);
    const supabase = getServerSupabase();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) {
      console.error("Failed to get auth user", userError);
      return Response.json(
        { error: "Failed to create recipe" },
        { status: 500, headers: { "Cache-Control": "no-store" } }
      );
    }
    if (!user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }


    const recipe = await recipeService.createRecipe(supabase, parsed);
    return Response.json(
      { data: recipe },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("Failed to create recipe", error);
      return respondWithSupabaseError(error);
    }
    const info = serializeUnknownError(error);
    console.error("Failed to create recipe", info, error);
    return Response.json(
      { error: "Failed to create recipe", details: info },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
