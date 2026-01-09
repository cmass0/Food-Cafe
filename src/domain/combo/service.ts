import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { isJson } from "../recipe/service";
import { buildBookmarkedSetCombo } from "./combo_bookmark/service";
import { buildLikedSetCombo } from "./combo_like/service";
import * as repo from "./repository";
import { ComboInsertSchema, comboListOptionsSchema, ComboUpdateSchema } from "./schema";
import {
  ComboInsertDb,
  ComboItems,
  ComboListOptions,
  ComboListResult,
  ComboRow,
  Combos,
  ComboSteps,
  ComboUpdateDb,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// json 형태로 저장된 조리단계를 ComboSteps 배열로 변환
export function toArraySteps(value: unknown): ComboSteps[] {
  if (!Array.isArray(value)) return [];

  const result: ComboSteps[] = [];
  for (const item of value) {
    if (!isJson(item)) continue;
    if (!item || typeof item !== "object") continue;
    const step = typeof item.description === "string" ? item.description.trim() : "";

    if (!step) continue;

    result.push({ description: step });
  }

  return result;
}

// json 형태로 저장된 아이템들을 ComboItems 배열로 변환
export function toArrayItems(value: unknown): ComboItems[] {
  if (!Array.isArray(value)) return [];
  const result: ComboItems[] = [];
  for (const item of value) {
    if (!isJson(item)) continue;
    if (!item || typeof item !== "object") continue;

    if (item.type === "recipe") {
      const recipeid = typeof item.recipeid === "string" ? item.recipeid.trim() : "";
      const summary = typeof item.summary === "string" ? item.summary.trim() : undefined;
      const image = typeof item.image === "string" ? item.image.trim() : null;
      const title = typeof item.title === "string" ? item.title.trim() : undefined;
      result.push({ type: "recipe", recipeid, summary, image, title });
    }
    if (item.type === "product") {
      const productName = typeof item.productName === "string" ? item.productName.trim() : "";
      const summary = typeof item.summary === "string" ? item.summary.trim() : undefined;
      const image = typeof item.image === "string" ? item.image.trim() : null;
      result.push({ type: "product", productName: productName, summary, image });
    }
  }
  return result;
}

function mapRowToCombination(row: ComboRow): Combos {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    steps: toArraySteps(row.steps),
    items: toArrayItems(row.items),
    tags: row.tags,
    tools: row.tools ?? null,
    difficulty: row.difficulty,
    timeMinutes: row.time_minutes,
    toolRequired: row.tools_required,
    image: row.image,
    likeCount: row.like_count,
    bookmarkCount: row.bookmark_count,
    viewCount: row.view_count,
    commentCount: row.comment_count,
    writerUid: row.writer_uid,
    writerName: row.writer_name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function listCombos(
  client: SupabaseClient<Database>,
  options?: ComboListOptions
): Promise<ComboListResult> {
  const {
    data: { user },
  } = await client.auth.getUser();
  const parsed = comboListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);

  const { items: rows, total: rowtotal } = await repo.fetchCombos(client, {
    limit,
    offset,
    search: parsed.search,
    writerUid: parsed.writerUid,
    searchField: parsed.searchField,
  });

  let items = rows.map(mapRowToCombination);
  const hasMore = offset + items.length < rowtotal;
  if (user) {
    const ids = items.map((combo) => combo.id);
    const bookmarkedSet = await buildBookmarkedSetCombo(client, ids);
    const likedSet = await buildLikedSetCombo(client, ids);
    items = items.map((combo) => ({
      ...combo,
      bookmarked: bookmarkedSet.has(combo.id),
      liked: likedSet.has(combo.id),
    }));
  }

  return { items, limit, offset, hasMore, total: rowtotal };
}

export async function listBookmarkedCombos(
  client: SupabaseClient<Database>,
  userId: string,
  options?: ComboListOptions
): Promise<ComboListResult> {
  const parsed = comboListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rowtotal } = await repo.selectCombobyBookmarked(
    client,
    {
      limit,
      offset,
      search: parsed.search,
      searchField: parsed.searchField,
    },
    userId
  );

  const items = rows.map((row) => ({
    ...mapRowToCombination(row),
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

export async function listLikedCombos(
  client: SupabaseClient<Database>,
  userId: string,
  options?: ComboListOptions
): Promise<ComboListResult> {
  const parsed = comboListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rowtotal } = await repo.selectByCombobyLiked(
    client,
    {
      limit,
      offset,
      search: parsed.search,
      searchField: parsed.searchField,
    },
    userId
  );

  const items = rows.map((row) => ({
    ...mapRowToCombination(row),
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

export async function getComboById(
  client: SupabaseClient<Database>,
  comboId: string
): Promise<Combos | null> {
  const row = await repo.fetchComboById(client, comboId);
  if (!row) {
    return null;
  }
  return mapRowToCombination(row);
}

export async function createCombo(
  client: SupabaseClient<Database>,
  input: ComboInsertDb
): Promise<Combos> {
  const parsed = ComboInsertSchema.parse(input);

  const row = await repo.insertCombo(client, parsed);
  return mapRowToCombination(row);
}
export async function updateCombo(
  client: SupabaseClient<Database>,
  id: string,
  patch: ComboUpdateDb
): Promise<Combos> {
  const parsed = ComboUpdateSchema.parse(patch);

  const row = await repo.updateCombo(client, id, parsed);
  return mapRowToCombination(row);
}

export async function removeCombo(client: SupabaseClient<Database>, id: string): Promise<void> {
  await repo.deleteCombo(client, id);
}
