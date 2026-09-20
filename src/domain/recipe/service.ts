import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { safePruneContentImages, safeRemoveContentImages } from "@/lib/storage/server";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBookmarkedSetRecipe } from "./recipe_bookmark/service";
import { buildLikedSetRecipe } from "./recipe_like/service";
import * as repo from "./repository";
import { recipeInsertSchema, recipeListOptionsSchema, recipeUpdateSchema } from "./schema";
import type {
  Recipe,
  RecipeInsertDB,
  RecipeListOptions,
  RecipeListResult,
  RecipeRow,
  RecipeUpdateDB,
} from "./types";
import { normalizeStoredImageReference, resolveStorageImageUrl } from "@/lib/storage/paths";
import {
  normaliseImageArray,
  normaliseTextArray,
  toArrayIngredient,
  toArraySteps,
} from "./normalization";

export { normaliseImageArray, normaliseTextArray, toArrayIngredient, toArraySteps };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// DB 행을 Recipe 도메인 객체로 변환
function mapRowToRecipe(row: RecipeRow): Recipe {
  const images = normaliseImageArray(row.images, row.image)
    .map(resolveStorageImageUrl)
    .filter((image): image is string => Boolean(image));

  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    chefTip: row.chef_tip ?? null,
    steps: toArraySteps(row.steps),
    ingredients: toArrayIngredient(row.ingredients),
    image: resolveStorageImageUrl(row.image),
    images,
    category: row.category,
    tags: normaliseTextArray(row.tags),
    tools: row.tools ?? null,
    toolsRequired: row.tools_required ?? false,
    difficulty: row.difficulty ?? null,
    timeMinutes: row.time_minutes ?? null,
    servings: row.servings ?? null,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    bookmarkCount: row.bookmark_count,
    viewCount: row.view_count,
    lastLikedAt: row.last_liked_at,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    writerUid: row.writer_uid ?? null,
    writerName: row.writer_name ?? null,
    writerEmail: row.writer_email ?? null,
  };
}

export async function listBookmarkedRecipes(
  client: SupabaseClient<Database>,
  userId: string,
  options?: RecipeListOptions
): Promise<RecipeListResult> {
  const parsed = recipeListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rowtotal } = await repo.selectRecipeByBookmarked(client, userId, {
    limit,
    offset,
    search: parsed.search,
    searchField: parsed.searchField,
  });

  const items = rows.map((row) => ({
    ...mapRowToRecipe(row),
    bookmarked: true,
  }));
  const total = Math.max(rowtotal, offset + items.length);
  const hasMore = offset + items.length < total;

  return {
    items,
    total,
    limit,
    offset,
    hasMore,
  };
}

export async function listLikedRecipes(
  client: SupabaseClient<Database>,
  userId: string,
  options?: RecipeListOptions
): Promise<RecipeListResult> {
  const parsed = recipeListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rowtotal } = await repo.selectRecipeByLike(client, userId, {
    limit,
    offset,
    search: parsed.search,
    searchField: parsed.searchField,
  });

  const items = rows.map((row) => ({
    ...mapRowToRecipe(row),
    liked: true,
  }));
  const total = Math.max(rowtotal, offset + items.length);
  const hasMore = offset + items.length < total;

  return {
    items,
    total,
    limit,
    offset,
    hasMore,
  };
}

export async function listRecipes(
  client: SupabaseClient<Database>,
  options?: RecipeListOptions
): Promise<RecipeListResult> {
  const parsed = recipeListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rowtotal } = await repo.fetchRecipes(client, {
    limit,
    offset,
    writerUid: parsed.writerUid,
    category: parsed.category,
    search: parsed.search,
    searchField: parsed.searchField,
    sort: parsed.sort,
  });

  let items = rows.map(mapRowToRecipe);
  const total = Math.max(rowtotal, offset + items.length);

  const hasMore = offset + items.length < total;
  let likedSet = new Set<string>();
  let bookmarkedSet = new Set<string>();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (user) {
    const ids = rows.map((row) => row.id);
    likedSet = await buildLikedSetRecipe(client, ids);
    bookmarkedSet = await buildBookmarkedSetRecipe(client, ids);
  }
  items = items.map((item) => ({
    ...item,
    liked: likedSet.has(item.id),
    bookmarked: bookmarkedSet.has(item.id),
  }));

  return {
    items,
    total,
    limit,
    offset,
    hasMore,
  };
}

export async function getRecipeById(
  client: SupabaseClient<Database>,
  id: string
): Promise<Recipe | null> {
  const row = await repo.selectRecipeById(client, id);
  return row ? mapRowToRecipe(row) : null;
}

export async function createRecipe(
  client: SupabaseClient<Database>,
  input: RecipeInsertDB
): Promise<Recipe> {
  const parsed = recipeInsertSchema.parse(input);
  const row = await repo.insertRecipe(client, {
    ...parsed,
    image: normalizeStoredImageReference(parsed.image),
    images: parsed.images
      ?.map(normalizeStoredImageReference)
      .filter((image): image is string => Boolean(image)),
  });
  return mapRowToRecipe(row);
}

export async function updateRecipe(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string,
  patch: RecipeUpdateDB
): Promise<Recipe | null> {
  const parsed = recipeUpdateSchema.parse(patch);
  const storedPatch: RecipeUpdateDB = {
    ...parsed,
    ...(parsed.image === undefined ? {} : { image: normalizeStoredImageReference(parsed.image) }),
    ...(parsed.images === undefined
      ? {}
      : {
          images: parsed.images
            .map(normalizeStoredImageReference)
            .filter((image): image is string => Boolean(image)),
        }),
  };
  const row = await repo.updateRecipe(client, id, writerUid, storedPatch);
  if (!row) return null;

  const recipe = mapRowToRecipe(row);
  if (row.writer_uid && (patch.image !== undefined || patch.images !== undefined)) {
    await safePruneContentImages("recipes", row.writer_uid, row.id, [row.image, row.images]);
  }
  return recipe;
}

export async function removeRecipe(client: SupabaseClient<Database>, id: string): Promise<boolean> {
  // 작성자/관리자 판정은 인증 사용자의 세션을 사용하는 RLS가 최종적으로 수행한다.
  const existing = await repo.selectRecipeById(client, id);
  if (!existing) return false;

  const deleted = await repo.deleteRecipe(client, id);
  if (deleted && existing.writer_uid) {
    await safeRemoveContentImages("recipes", existing.writer_uid, existing.id);
  }
  return deleted;
}
