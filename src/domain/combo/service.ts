import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { safePruneContentImages, safeRemoveContentImages } from "@/lib/storage/server";
import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";

import { normalizeStoredImageReference, resolveStorageImageUrl } from "@/lib/storage/paths";
import { buildBookmarkedSetCombo } from "./combo_bookmark/service";
import { buildLikedSetCombo } from "./combo_like/service";
import { toArrayItems, toArraySteps } from "./normalization";
import * as repo from "./repository";
import { ComboInsertSchema, comboListOptionsSchema, ComboUpdateSchema } from "./schema";
import {
  ComboInsertDb,
  ComboItems,
  ComboListOptions,
  ComboListResult,
  ComboRow,
  Combos,
  ComboUpdateDb,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export { toArrayItems, toArraySteps } from "./normalization";

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
    image: resolveStorageImageUrl(row.image),
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

function normalizeStoredComboItems(items: ComboItems[] | null | undefined): ComboItems[] {
  if (!items) return [];
  return items.map((item) => ({
    ...item,
    image: normalizeStoredImageReference(item.image),
  })) as ComboItems[];
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
    sort: parsed.sort,
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

  const row = await repo.insertCombo(client, {
    ...parsed,
    image: normalizeStoredImageReference(parsed.image),
    items: normalizeStoredComboItems(parsed.items),
  });
  return mapRowToCombination(row);
}
export async function updateCombo(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string,
  patch: ComboUpdateDb
): Promise<Combos | null> {
  const parsed = ComboUpdateSchema.parse(patch);

  const storedPatch = {
    ...parsed,
    ...(parsed.image === undefined ? {} : { image: normalizeStoredImageReference(parsed.image) }),
    ...(parsed.items === undefined ? {} : { items: normalizeStoredComboItems(parsed.items) }),
  };
  const row = await repo.updateCombo(client, id, writerUid, storedPatch);
  if (!row) return null;

  const combo = mapRowToCombination(row);
  if (row.writer_uid && (patch.image !== undefined || patch.items !== undefined)) {
    await safePruneContentImages("combos", row.writer_uid, row.id, [row.image, row.items]);
  }
  return combo;
}

export async function removeCombo(client: SupabaseClient<Database>, id: string): Promise<boolean> {
  // 작성자/관리자 판정은 인증 사용자의 세션을 사용하는 RLS가 최종적으로 수행한다.
  const existing = await repo.fetchComboById(client, id);
  if (!existing) return false;

  const deleted = await repo.deleteCombo(client, id);
  if (deleted && existing.writer_uid) {
    await safeRemoveContentImages("combos", existing.writer_uid, existing.id);
  }
  return deleted;
}
