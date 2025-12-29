import { resolveLimit, resolveOffset } from "@/lib/pagination";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBookmarkedSetRecipe } from "../user/user_bookmark/service";
import { buildLikedSetRecipe } from "../user/user_like/service";
import * as repo from "./repository";
import { recipeInsertSchema, recipeListOptionsSchema, recipeUpdateSchema } from "./schema";
import type {
  Recipe,
  RecipeIngredient,
  RecipeInsertDB,
  RecipeListOptions,
  RecipeListResult,
  RecipeRow,
  RecipeStep,
  RecipeUpdateDB,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function normaliseTextArray(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

// 객체가 JSON 형태인지 검사
export function isJson(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null;
}

// json 형태로 저장된 재료목록을 RecipeIngredient 배열로 변환
export function toArrayIngredient(value: unknown): RecipeIngredient[] {
  if (!Array.isArray(value)) return [];

  const result: RecipeIngredient[] = [];
  for (const item of value) {
    if (!isJson(item)) continue;

    if (!item || typeof item !== "object") continue;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    const amount = typeof item.amount === "string" ? item.amount.trim() : "";
    const unit = typeof item.unit === "string" ? item.unit.trim() : "";
    const unitCustom = typeof item.unitCustom === "string" ? item.unitCustom.trim() : "";

    if (!name && !amount && !unit && !unitCustom) continue;

    result.push({ name, amount, unit, unitCustom });
  }

  return result;
}

// json 형태로 저장된 조리단계를 RecipeStep 배열로 변환
export function toArraySteps(value: unknown): RecipeStep[] {
  if (!Array.isArray(value)) return [];

  const result: RecipeStep[] = [];
  for (const item of value) {
    if (!isJson(item)) continue;
    if (!item || typeof item !== "object") continue;
    const step = typeof item.description === "string" ? item.description.trim() : "";

    if (!step) continue;

    result.push({ description: step });
  }

  return result;
}

// DB 행을 Recipe 도메인 객체로 변환
function mapRowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    steps: toArraySteps(row.steps),
    ingredients: toArrayIngredient(row.ingredients),
    image: row.image,
    category: row.category,
    tags: normaliseTextArray(row.tags),
    difficulty: row.difficulty ?? null,
    timeMinutes: row.time_minutes ?? null,
    servings: row.servings ?? null,
    likeCount: row.like_count,
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
    tags: parsed.tags,
    search: parsed.search,
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
    tags: parsed.tags,
    search: parsed.search,
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
    tags: parsed.tags,
    writerUid: parsed.writerUid,
    search: parsed.search,
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
  const row = await repo.insertRecipe(client, parsed);
  return mapRowToRecipe(row);
}

export async function updateRecipe(
  client: SupabaseClient<Database>,
  id: string,
  patch: RecipeUpdateDB
): Promise<Recipe> {
  const parsed = recipeUpdateSchema.parse(patch);
  const row = await repo.updateRecipe(client, id, parsed);
  return mapRowToRecipe(row);
}

export async function removeRecipe(client: SupabaseClient<Database>, id: string): Promise<void> {
  await repo.deleteRecipe(client, id);
}
