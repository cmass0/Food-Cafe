import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBookmarkedSet } from "../user_bookmark/service";
import { buildLikedSet } from "../user_like/service";
import * as repository from "./repository";
import { recipeInsertSchema, recipeListOptionsSchema, recipeUpdateSchema } from "./schema";
import type {
  Recipe,
  RecipeIngredient,
  RecipeInsertDB,
  RecipeInsertInput,
  RecipeListOptions,
  RecipeListResult,
  RecipeRow,
  RecipeUpdateDB,
  RecipeUpdateInput,
  RecipeWriterInfo,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function normaliseTextArray(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

export function normaliseIngredients(
  value: RecipeRow["ingredients"] | undefined
): RecipeIngredient[] {
  if (!Array.isArray(value)) return [];

  const result: RecipeIngredient[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const name = typeof (item as any).name === "string" ? (item as any).name.trim() : "";
    const amount = typeof (item as any).amount === "string" ? (item as any).amount.trim() : "";
    const unit = typeof (item as any).unit === "string" ? (item as any).unit.trim() : "";
    const unitCustom =
      typeof (item as any).unitCustom === "string" ? (item as any).unitCustom.trim() : "";

    // 모든 필드가 비어 있으면 스킵
    if (!name && !amount && !unit && !unitCustom) continue;

    result.push({ name, amount, unit, unitCustom });
  }

  return result;
}

function mapRowToRecipe(row: RecipeRow): Recipe {
  const anyRow = row as any;
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    recipe: row.recipe,
    ingredients: normaliseIngredients((row as any).ingredients),
    image: row.image,
    category: row.category,
    tags: normaliseTextArray(row.tags),
    difficulty: anyRow.difficulty ?? null,
    timeMinutes: anyRow.time_minutes ?? null,
    servings: anyRow.servings ?? null,
    likeCount: row.like_count ?? 0,
    viewCount: row.view_count ?? 0,
    lastLikedAt: row.last_liked_at,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    writerUid: row.writer_uid ?? null,
    writerName: row.writer_name ?? null,
    writerEmail: row.writer_email ?? null,
  };
}

function buildInsertPayload(input: RecipeInsertInput, writer?: RecipeWriterInfo): RecipeInsertDB {
  const image = input.image?.trim();
  const recipe = input.recipe?.trim();
  if (!image) {
    throw new Error("이미지 경로가 필요합니다.");
  }
  if (!recipe) {
    throw new Error("레시피 본문이 필요합니다.");
  }
  if (!input.ingredients || input.ingredients.length === 0) {
    throw new Error("재료를 한 개 이상 입력해 주세요.");
  }
  return {
    ...(input.id ? { id: input.id } : {}),
    title: input.title,
    summary: input.summary ?? null,
    recipe,
    ingredients: input.ingredients,
    image,
    category: input.category && input.category.trim().length > 0 ? input.category.trim() : null,
    tags: input.tags ?? [],
    difficulty: (input as any).difficulty ?? null,
    time_minutes: (input as any).time_minutes ?? null,
    servings: (input as any).servings ?? null,
    ...(writer?.uid ? { writer_uid: writer.uid } : {}),
    ...(writer?.name ? { writer_name: writer.name } : {}),
    ...(writer?.email ? { writer_email: writer.email } : {}),
  };
}

function buildUpdatePayload(patch: RecipeUpdateInput): RecipeUpdateDB {
  const payload: RecipeUpdateDB = {};
  // 바뀌는 필드만 if로 처리
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.summary !== undefined) payload.summary = patch.summary;
  if (patch.recipe !== undefined) payload.recipe = patch.recipe;
  if (patch.ingredients !== undefined) payload.ingredients = patch.ingredients;
  if (patch.image !== undefined) payload.image = patch.image;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.tags !== undefined) payload.tags = patch.tags;
  if ((patch as any).difficulty !== undefined)
    payload.difficulty = (patch as any).difficulty ?? null;
  if ((patch as any).time_minutes !== undefined)
    payload.time_minutes = (patch as any).time_minutes ?? null;
  if ((patch as any).servings !== undefined) payload.servings = (patch as any).servings ?? null;

  return payload;
}

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) return DEFAULT_LIMIT;
  const truncated = Math.trunc(limit);
  if (truncated < 1) return 1;
  if (truncated > MAX_LIMIT) return MAX_LIMIT;
  return truncated;
}

function resolveOffset(page: number | undefined, limit: number): number {
  if (typeof page === "number" && Number.isFinite(page)) {
    const safePage = Math.max(1, Math.trunc(page));
    return (safePage - 1) * limit;
  }
  return 0;
}

// 로그인 유저의 북마크 list
export async function listBookmarkedRecipes(
  client: SupabaseClient<Database>,
  userId: string,
  options?: RecipeListOptions
): Promise<RecipeListResult> {
  const parsed = recipeListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rowtotal } = await repository.selectRecipeByBookmarked(
    client,
    userId,
    {
      limit,
      offset,
      tags: parsed.tags,
      search: parsed.search,
    }
  );

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

// 로그인 유저의 좋아요 list
export async function listLikedRecipes(
  client: SupabaseClient<Database>,
  userId: string,
  options?: RecipeListOptions
): Promise<RecipeListResult> {
  const parsed = recipeListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rowtotal } = await repository.selectRecipeByLike(client, userId, {
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
  const limit = resolveLimit(parsed.limit);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rowtotal } = await repository.fetchRecipes(client, {
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
    likedSet = await buildLikedSet(client, ids);
    bookmarkedSet = await buildBookmarkedSet(client, ids);
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

export async function getRecipe(
  client: SupabaseClient<Database>,
  id: string
): Promise<Recipe | null> {
  const row = await repository.selectRecipeById(client, id);
  return row ? mapRowToRecipe(row) : null;
}

export async function createRecipe(
  client: SupabaseClient<Database>,
  input: RecipeInsertInput,
  writer?: RecipeWriterInfo
): Promise<Recipe> {
  const parsed = recipeInsertSchema.parse(input);
  const payload = buildInsertPayload(parsed, writer);
  const row = await repository.insertRecipeRecord(client, payload);
  return mapRowToRecipe(row);
}

export async function updateRecipe(
  client: SupabaseClient<Database>,
  id: string,
  patch: RecipeUpdateInput
): Promise<Recipe> {
  const parsed = recipeUpdateSchema.parse(patch);
  const payload = buildUpdatePayload(parsed);

  const row = await repository.updateRecipeRecordByOwner(client, id, payload);
  return mapRowToRecipe(row);
}

export async function removeRecipe(client: SupabaseClient<Database>, id: string): Promise<void> {
  await repository.deleteRecipeRecord(client, id);
}
