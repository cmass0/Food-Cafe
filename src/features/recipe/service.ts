import {
  recipeInsertSchema,
  recipeListOptionsSchema,
  recipeUpdateSchema,
} from "./schema";
import * as repository from "./repository";
import type {
  Recipe,
  RecipeInsertDB,
  RecipeInsertInput,
  RecipeListOptions,
  RecipeListResult,
  RecipeRow,
  RecipeSupabaseClient,
  RecipeUpdateDB,
  RecipeUpdateInput,
  RecipeWriterInfo,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;



function normaliseTextArray(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

function mapRowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    recipe: row.recipe,
    image: row.image,
    category: row.category,
    tags: normaliseTextArray(row.tags),
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
  if (!image) {
    throw new Error("이미지 경로가 필요합니다.");
  }
  return {
    ...(input.id ? { id: input.id } : {}),
    title: input.title,
    summary: input.summary ?? null,
    recipe: input.recipe ?? null,
    image,
    category: input.category && input.category.trim().length > 0 ? input.category.trim() : null,
    tags: input.tags ?? [],
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
  if (patch.image !== undefined) payload.image = patch.image;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.tags !== undefined) payload.tags = patch.tags;

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

export async function listRecipes(
  client: RecipeSupabaseClient,
  options?: RecipeListOptions
): Promise<RecipeListResult> {
  const parsed = recipeListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rawTotal } = await repository.fetchRecipes(client, {
    limit,
    offset,
    tag: parsed.tag,
    writerUid: parsed.writerUid,
    search: parsed.search,
  });

  const items = rows.map(mapRowToRecipe);
  const total = Math.max(rawTotal, offset + items.length);
  const hasMore = offset + items.length < total;

  return {
    items,
    total,
    limit,
    offset,
    hasMore,
  };
}

export async function getRecipe(
  client: RecipeSupabaseClient,
  id: string
): Promise<Recipe | null> {
  const row = await repository.selectRecipeById(client, id);
  return row ? mapRowToRecipe(row) : null;
}

export async function createRecipe(
  client: RecipeSupabaseClient,
  input: RecipeInsertInput,
  writer?: RecipeWriterInfo
): Promise<Recipe> {
  const parsed = recipeInsertSchema.parse(input);
  const payload = buildInsertPayload(parsed, writer);
  const row = await repository.insertRecipeRecord(client, payload);
  return mapRowToRecipe(row);
}

export async function updateRecipe(
  client: RecipeSupabaseClient,
  id: string,
  patch: RecipeUpdateInput
): Promise<Recipe> {
  const parsed = recipeUpdateSchema.parse(patch);
  const payload = buildUpdatePayload(parsed);

  const row = await repository.updateRecipeRecordByOwner(client, id, payload);
  return mapRowToRecipe(row);
}

export async function removeRecipe(
  client: RecipeSupabaseClient,
  id: string
): Promise<void> {
  await repository.deleteRecipeRecord(client, id);
}

