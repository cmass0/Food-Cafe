import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { safePruneContentImages, safeRemoveContentImages } from "@/lib/storage/server";
import { syncComboRecommendationDocument } from "@/domain/recommend/recommendation-index";
import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { ZodError } from "zod";

import { normalizeStoredImageReference, resolveStorageImageUrl } from "@/lib/storage/paths";
import { buildBookmarkedSetCombo } from "./combo_bookmark/service";
import { buildLikedSetCombo } from "./combo_like/service";
import { COMBO_RECIPE_REFERENCE_ERRORS } from "./messages";
import { toArrayItems, toArraySteps } from "./normalization";
import { fillRecipeItems, type LoadComboRecipes } from "./recipe-reference";
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

// 레시피 항목에는 요청자가 읽을 수 있는 레시피만 넣고, 제목·설명·사진은 DB의 레시피 값으로 저장한다.
// 브라우저가 보낸 값은 비어 있거나(불러오기 전 저장) 조작됐을 수 있다. 찾지 못한 레시피는 그 칸의 입력 오류로 돌린다.
async function withStoredRecipeDetails<T extends ComboItems>(
  items: T[],
  loadRecipes: LoadComboRecipes
) {
  const ids = [
    ...new Set(items.flatMap((item) => (item.type === "recipe" ? [item.recipeid] : []))),
  ];
  const { items: filled, missing } = fillRecipeItems(items, await loadRecipes(ids));
  if (missing.length > 0) {
    throw new ZodError(
      missing.map((index) => ({
        code: "custom" as const,
        path: ["items", index, "recipeid"],
        message: COMBO_RECIPE_REFERENCE_ERRORS.notFound,
      }))
    );
  }
  return filled;
}

// loadRecipes는 레시피 항목을 채울 레시피를 읽는다. 라우트·서버 액션은 features/combo-save를 거쳐 부른다.
export async function createCombo(
  client: SupabaseClient<Database>,
  input: ComboInsertDb,
  loadRecipes: LoadComboRecipes
): Promise<Combos> {
  const parsed = ComboInsertSchema.parse(input);
  const items = await withStoredRecipeDetails(parsed.items, loadRecipes);

  const row = await repo.insertCombo(client, {
    ...parsed,
    image: normalizeStoredImageReference(parsed.image),
    items: normalizeStoredComboItems(items),
  });
  await syncComboRecommendationDocument(row);
  return mapRowToCombination(row);
}
export async function updateCombo(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string,
  patch: ComboUpdateDb,
  loadRecipes: LoadComboRecipes
): Promise<Combos | null> {
  const parsed = ComboUpdateSchema.parse(patch);
  const items =
    parsed.items === undefined
      ? undefined
      : await withStoredRecipeDetails(parsed.items, loadRecipes);

  const storedPatch = {
    ...parsed,
    ...(parsed.image === undefined ? {} : { image: normalizeStoredImageReference(parsed.image) }),
    ...(items === undefined ? {} : { items: normalizeStoredComboItems(items) }),
  };
  const row = await repo.updateCombo(client, id, writerUid, storedPatch);
  if (!row) return null;

  await syncComboRecommendationDocument(row);
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
