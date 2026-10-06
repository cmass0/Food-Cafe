import { isRecipeCategoryKey } from "@/domain/recipe/category";
import {
  parseRecipeListLimit,
  parseRecipeListPage,
  parseRecipeSearchField,
  parseRecipeSort,
} from "@/domain/recipe/list-params";
import { recipeInsertSchema } from "@/domain/recipe/schema";
import * as recipeService from "@/domain/recipe/service";
import { AuthErrorHelper, badRequest, json, respondWithError } from "@/lib/errors/api-response";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    // page·limit이 없거나 잘못되면 서비스 기본값을 쓴다. 예전에는 없는 값을 0으로 읽어 500이 났다.
    const limit = parseRecipeListLimit(url.searchParams.get("limit"));
    const page = parseRecipeListPage(url.searchParams.get("page"));
    const writerUid = url.searchParams.get("writerUid") || undefined;
    const categoryParam = url.searchParams.get("category");
    const category = isRecipeCategoryKey(categoryParam) ? categoryParam : undefined;
    const search = url.searchParams.get("search") || undefined;
    const searchField = parseRecipeSearchField(url.searchParams.get("searchField"));
    const sort = parseRecipeSort(url.searchParams.get("sort"));
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
    return respondWithError(error, "레시피 조회 실패");
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
    });
    return json({ data: recipe }, 201);
  } catch (error) {
    return respondWithError(error, "레시피 생성 실패");
  }
}
