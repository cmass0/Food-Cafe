import {
  recipeInsertSchema,
  recipeListOptionsSchema,
  recipeUpdateSchema,
} from "./schema";
import * as repository from "./repository";
import type {
  Recipe,
  RecipeCursorFilter,
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

type CursorPayload = {
  created_at?: string;
  id?: string;
};

function normaliseTextArray(value: string[] | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

function generateLegacyId(): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return `tmp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapRowToRecipe(row: RecipeRow): Recipe {
  return {
    id: row.id,
    idTextOld: row.id_text_old,
    legacyId: row.legacy_id,
    title: row.title,
    summary: row.summary,
    recipe: row.recipe,
    image: row.image,
    images: normaliseTextArray(row.images),
    category: row.category,
    tags: normaliseTextArray(row.tags),
    likeCount: row.like_count ?? 0,
    viewCount: row.view_count ?? 0,
    lastLikedAt: row.last_liked_at,
    status: row.status,
    writerUid: row.writer_uid,
    writerUidLegacy: row.writer_uid_legacy,
    writerName: row.writer_name,
    writerEmail: row.writer_email,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function buildInsertPayload(input: RecipeInsertInput): RecipeInsertDB {
  return {
    id_text_old: input.idTextOld ?? generateLegacyId(),
    legacy_id: input.legacyId ?? null,
    title: input.title,
    summary: input.summary ?? null,
    recipe: input.recipe ?? null,
    image: input.image ?? null,
    images: input.images ?? [],
    category: input.category ?? null,
    tags: input.tags ?? [],
    status: input.status ?? 0,
    writer_uid: input.writerUid ?? null,
    writer_uid_legacy: input.writerUidLegacy ?? null,
    writer_name: input.writerName ?? null,
    writer_email: input.writerEmail ?? null,
  };
}

function buildUpdatePayload(patch: RecipeUpdateInput): RecipeUpdateDB {
  const payload: RecipeUpdateDB = {};

  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.summary !== undefined) payload.summary = patch.summary;
  if (patch.recipe !== undefined) payload.recipe = patch.recipe;
  if (patch.image !== undefined) payload.image = patch.image;
  if (patch.images !== undefined) payload.images = patch.images;
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

function parseCursor(cursor?: string | null): RecipeCursorFilter | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as CursorPayload;
    if (!payload.created_at || !payload.id) return null;
    return { createdAt: payload.created_at, id: payload.id };
  } catch {
    return null;
  }
}

function toCursor(row: RecipeRow): string {
  const payload = JSON.stringify({
    created_at: row.created_at,
    id: row.id,
  });
  return Buffer.from(payload).toString("base64url");
}

export async function listRecipes(
  client: RecipeSupabaseClient,
  options?: RecipeListOptions
): Promise<RecipeListResult> {
  const parsed = recipeListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit);
  const rows = await repository.fetchRecipes(client, {
    limit: limit + 1,
    tag: parsed.tag,
    status: parsed.status,
    writerUid: parsed.writerUid,
    search: parsed.search,
    cursor: parseCursor(parsed.cursor),
  });

  const hasExtra = rows.length > limit;
  const items = hasExtra ? rows.slice(0, limit) : rows;
  const cursorRow = hasExtra ? rows[limit] : null;

  return {
    items: items.map(mapRowToRecipe),
    nextCursor: cursorRow ? toCursor(cursorRow) : null,
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
