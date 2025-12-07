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
    idTextOld: (row as any).id_text_old ?? null,
    legacyId: (row as any).legacy_id ?? null,
    title: row.title,
    summary: row.summary,
    recipe: row.recipe,
    image: row.image,
    category: row.category,
    tags: normaliseTextArray(row.tags),
    likeCount: row.like_count ?? 0,
    viewCount: row.view_count ?? 0,
    lastLikedAt: row.last_liked_at,
    status: row.status,
    writerUid: row.writer_uid,
    writerUidLegacy: (row as any).writer_uid_legacy ?? null,
    writerName: row.writer_name,
    writerEmail: row.writer_email,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function buildInsertPayload(input: RecipeInsertInput): RecipeInsertDB {
  return {
    id_text_old: input.idTextOld ?? null,
    legacy_id: input.legacyId ?? null,
    title: input.title,
    summary: input.summary ?? null,
    recipe: input.recipe ?? null,
    image: input.image && input.image.trim().length > 0 ? input.image.trim() : null,
    category: input.category && input.category.trim().length > 0 ? input.category.trim() : null,
    tags: input.tags ?? [],
    status: input.status ?? null,
    writer_uid: input.writerUid ?? null,
    writer_uid_legacy: input.writerUidLegacy ?? null,
    writer_name: input.writerName && input.writerName.trim().length > 0 ? input.writerName.trim() : null,
    writer_email: input.writerEmail && input.writerEmail.trim().length > 0 ? input.writerEmail.trim() : null,
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
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.writerUid !== undefined) payload.writer_uid = patch.writerUid;
  if (patch.writerUidLegacy !== undefined) payload.writer_uid_legacy = patch.writerUidLegacy;
  if (patch.writerName !== undefined) payload.writer_name = patch.writerName;
  if (patch.writerEmail !== undefined) payload.writer_email = patch.writerEmail;

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
    status: parsed.status,
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
  input: RecipeInsertInput
): Promise<Recipe> {
  const parsed = recipeInsertSchema.parse(input);
  const payload = buildInsertPayload(parsed);
  const row = await repository.insertRecipeRecord(client, payload);
  return mapRowToRecipe(row);
}

export async function updateRecipe(
  client: RecipeSupabaseClient,
  id: string,
  patch: RecipeUpdateInput
): Promise<Recipe> {
  // 1) 로그인 사용자 확인
  const { data: auth } = await client.auth.getUser();
  const me = auth?.user;
  if (!me) throw new Error("로그인이 필요합니다.");

  // 2) 유효성 검사 및 허용된 필드만 추출
  const parsed = recipeUpdateSchema.parse(patch);
  const payload = buildUpdatePayload(parsed);

  // 3) 소유자(writer_uid)가 일치할 때만 업데이트 수행
  const row = await repository.updateRecipeRecordByOwner(client, id, me.id, payload);
  return mapRowToRecipe(row);
}

export async function removeRecipe(
  client: RecipeSupabaseClient,
  id: string
): Promise<void> {
  await repository.deleteRecipeRecord(client, id);
}

