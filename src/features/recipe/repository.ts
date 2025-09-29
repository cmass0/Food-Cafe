import type { PostgrestError } from "@supabase/supabase-js";
import type {
  Recipe,
  RecipeInsertInput,
  RecipeListOptions,
  RecipeListResult,
  RecipeRow,
  RecipeSupabaseClient,
  RecipeUpdateInput,
} from "./types";

const RECIPE_COLUMNS = [
  "id",
  "id_text_old",
  "legacy_id",
  "title",
  "summary",
  "recipe",
  "image",
  "images",
  "category",
  "tags",
  "like_count",
  "view_count",
  "last_liked_at",
  "status",
  "writer_uid",
  "writer_uid_legacy",
  "writer_name",
  "writer_email",
  "created_at",
  "updated_at",
].join(", ");

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

function buildInsertPayload(input: RecipeInsertInput) {
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

function buildUpdatePayload(patch: RecipeUpdateInput) {
  const payload: Record<string, unknown> = {};

  if (patch.idTextOld !== undefined) payload.id_text_old = patch.idTextOld ?? generateLegacyId();
  if (patch.legacyId !== undefined) payload.legacy_id = patch.legacyId;
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.summary !== undefined) payload.summary = patch.summary;
  if (patch.recipe !== undefined) payload.recipe = patch.recipe;
  if (patch.image !== undefined) payload.image = patch.image;
  if (patch.images !== undefined) payload.images = patch.images ?? [];
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.tags !== undefined) payload.tags = patch.tags ?? [];
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.writerUid !== undefined) payload.writer_uid = patch.writerUid;
  if (patch.writerUidLegacy !== undefined) payload.writer_uid_legacy = patch.writerUidLegacy;
  if (patch.writerName !== undefined) payload.writer_name = patch.writerName;
  if (patch.writerEmail !== undefined) payload.writer_email = patch.writerEmail;
  if (patch.likeCount !== undefined) payload.like_count = patch.likeCount;
  if (patch.viewCount !== undefined) payload.view_count = patch.viewCount;
  if (patch.lastLikedAt !== undefined) payload.last_liked_at = patch.lastLikedAt;

  return payload;
}

function toCursor(row: RecipeRow): string {
  const payload = JSON.stringify({
    created_at: row.created_at,
    id: row.id,
  });
  return Buffer.from(payload).toString("base64url");
}

function fromCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const json = Buffer.from(cursor, "base64url").toString("utf8");
    const value = JSON.parse(json) as { created_at?: string; id?: string };
    if (!value.created_at || !value.id) return null;
    return { createdAt: value.created_at, id: value.id };
  } catch {
    return null;
  }
}

function throwIfError(error: PostgrestError | null, action: string): never | void {
  if (error) {
    throw new Error(`[recipes] ${action} 실패: ${error.message}`);
  }
}

export async function listRecipes(
  client: RecipeSupabaseClient,
  options: RecipeListOptions = {}
): Promise<RecipeListResult> {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  let query = client
    .from("recipes")
    .select(RECIPE_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(limit + 1);

  if (options.tag) {
    query = query.contains("tags", [options.tag]);
  }

  if (options.status !== undefined) {
    query = query.eq("status", options.status);
  }

  if (options.writerUid) {
    query = query.eq("writer_uid", options.writerUid);
  }

  if (options.search) {
    query = query.textSearch("tsv", options.search, { type: "plain" });
  }

  if (options.cursor) {
    const decoded = fromCursor(options.cursor);
    if (decoded) {
      query = query.or(
        `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.gt.${decoded.id})`
      );
    }
  }

  const { data, error } = await query;
  throwIfError(error, "목록 조회");

  if (!data) {
    return { items: [], nextCursor: null };
  }

  const rows = data as unknown as RecipeRow[];
  const hasExtra = rows.length > limit;
  const trimmed = hasExtra ? rows.slice(0, limit) : rows;

  return {
    items: trimmed.map(mapRowToRecipe),
    nextCursor: hasExtra && rows[limit] ? toCursor(rows[limit]) : null,
  };
}

export async function getRecipe(client: RecipeSupabaseClient, id: string): Promise<Recipe | null> {
  const { data, error } = await client
    .from("recipes")
    .select(RECIPE_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  throwIfError(error, "단일 조회");
  if (!data) return null;
  return mapRowToRecipe(data as unknown as RecipeRow);
}

export async function createRecipe(
  client: RecipeSupabaseClient,
  input: RecipeInsertInput
): Promise<Recipe> {
  const payload = buildInsertPayload(input);
  const { data, error } = await client
    .from("recipes")
    .insert(payload)
    .select(RECIPE_COLUMNS)
    .single();
  throwIfError(error, "생성");
  if (!data) {
    throw new Error("레시피 생성 결과가 비어 있습니다.");
  }
  return mapRowToRecipe(data as unknown as RecipeRow);
}

export async function updateRecipe(
  client: RecipeSupabaseClient,
  id: string,
  patch: RecipeUpdateInput
): Promise<Recipe> {
  const payload = buildUpdatePayload(patch);
  const { data, error } = await client
    .from("recipes")
    .update(payload)
    .eq("id", id)
    .select(RECIPE_COLUMNS)
    .single();
  throwIfError(error, "수정");
  if (!data) {
    throw new Error("수정된 레시피를 찾을 수 없습니다.");
  }
  return mapRowToRecipe(data as unknown as RecipeRow);
}

export async function removeRecipe(client: RecipeSupabaseClient, id: string): Promise<void> {
  const { error } = await client.from("recipes").delete().eq("id", id);
  throwIfError(error, "삭제");
}
