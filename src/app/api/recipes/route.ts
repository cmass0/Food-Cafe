import { isRecipeCategoryKey } from "@/domain/recipe/category";
import { recipeInsertSchema } from "@/domain/recipe/schema";
import * as recipeService from "@/domain/recipe/service";
import type { RecipeSearchField, RecipeSort } from "@/domain/recipe/types";
import { derivePublicDisplayName } from "@/domain/user/lib/displayName";
import {
  AuthErrorHelper,
  badRequest,
  internalError,
  isPostgrestError,
  json,
  respondWithSupabaseError,
  validationError,
} from "@/lib/api/route-error";
import { getServerSupabase } from "@/lib/supabase/server";
import { ZodError } from "zod";

function parseRecipeSearchField(value: string | null): RecipeSearchField | undefined {
  if (value === "tag" || value === "title" || value === "tag_title" || value === "writer") {
    return value;
  }
  return undefined;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = Number(url.searchParams.get("limit"));
    const pageParam = Number(url.searchParams.get("page"));
    const limit = Number.isFinite(limitParam) ? limitParam : undefined;
    const page = Number.isFinite(pageParam) ? pageParam : undefined;
    const writerUid = url.searchParams.get("writerUid") || undefined;
    const categoryParam = url.searchParams.get("category");
    const category = isRecipeCategoryKey(categoryParam) ? categoryParam : undefined;
    const search = url.searchParams.get("search") || undefined;
    const searchField = parseRecipeSearchField(url.searchParams.get("searchField"));
    const sortParam = url.searchParams.get("sort");
    const sort =
      sortParam === "recent" || sortParam === "like" || sortParam === "view"
        ? (sortParam as RecipeSort)
        : undefined;
    const supabase = await getServerSupabase();

    const recipes = await recipeService.listRecipes(supabase, {
      limit,
      page,
      writerUid,
      category,
      search,
      searchField,
      sort,
    });

    return json({ data: recipes });
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 조회 실패", error);
      return respondWithSupabaseError(error);
    }
    console.error("레시피 조회 실패", error);
    return internalError();
  }
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return badRequest("잘못된 JSON 형식입니다.");
    }
    const supabase = await getServerSupabase();
    const parsed = recipeInsertSchema.parse(body);

    const { user, error: authError } = await AuthErrorHelper();
    if (authError) return authError;

    const recipe = await recipeService.createRecipe(supabase, {
      ...parsed,
      writer_uid: user.id,
      writer_name: derivePublicDisplayName(user) ?? "user",
      writer_email: user.email ?? undefined,
    });
    return json({ data: recipe }, 201);
  } catch (error) {
    if (isPostgrestError(error)) {
      console.error("레시피 생성 실패", error);
      return respondWithSupabaseError(error);
    }
    if (error instanceof ZodError) {
      console.error("레시피 생성 실패 - zod검증 오류", error);
      return validationError(error.errors);
    }
    return internalError();
  }
}
