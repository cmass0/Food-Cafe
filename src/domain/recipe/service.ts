import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { safePruneContentImages, safeRemoveContentImages } from "@/lib/storage/server";
import { syncRecipeRecommendationDocument } from "@/domain/recommend/recommendation-index";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBookmarkedSetRecipe } from "./recipe_bookmark/service";
import { buildLikedSetRecipe } from "./recipe_like/service";
import * as repo from "./repository";
import {
  MAX_RECIPE_LIST_LIMIT,
  recipeInsertSchema,
  recipeListOptionsSchema,
  recipeUpdateSchema,
} from "./schema";
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

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = MAX_RECIPE_LIST_LIMIT;

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

/** viewerId를 이미 알면 넘겨서 로그인 확인 요청을 아낀다(null은 비로그인). */
export async function listRecipes(
  client: SupabaseClient<Database>,
  options?: RecipeListOptions,
  viewerId?: string | null
): Promise<RecipeListResult> {
  const parsed = recipeListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);
  // 목록 조회와 로그인 확인은 서로 기다릴 필요가 없어 함께 보낸다.
  const [{ items: rows, total: rowtotal }, userId] = await Promise.all([
    repo.fetchRecipes(client, {
      limit,
      offset,
      writerUid: parsed.writerUid,
      category: parsed.category,
      search: parsed.search,
      searchField: parsed.searchField,
      sort: parsed.sort,
    }),
    viewerId === undefined
      ? client.auth.getUser().then(({ data }) => data.user?.id ?? null)
      : viewerId,
  ]);

  let items = rows.map(mapRowToRecipe);
  const total = Math.max(rowtotal, offset + items.length);

  const hasMore = offset + items.length < total;
  let likedSet = new Set<string>();
  let bookmarkedSet = new Set<string>();

  if (userId && rows.length > 0) {
    const ids = rows.map((row) => row.id);
    [likedSet, bookmarkedSet] = await Promise.all([
      buildLikedSetRecipe(client, userId, ids),
      buildBookmarkedSetRecipe(client, userId, ids),
    ]);
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

// 요청한 ID 순서대로 돌려준다. 삭제됐거나 읽을 권한이 없는 레시피는 빠진다.
// DB는 UUID를 대소문자 구분 없이 찾고 소문자로 돌려주므로, 짝을 지을 때도 소문자로 맞춘다.
export async function getRecipesByIds(
  client: SupabaseClient<Database>,
  ids: string[]
): Promise<Recipe[]> {
  const rows = await repo.selectRecipesByIds(client, ids);
  const byId = new Map(rows.map((row) => [row.id.toLowerCase(), row]));
  return ids.flatMap((id) => {
    const row = byId.get(id.toLowerCase());
    return row ? [mapRowToRecipe(row)] : [];
  });
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
  await syncRecipeRecommendationDocument(row);
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

  await syncRecipeRecommendationDocument(row);
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

export async function countRecipesByWriter(
  client: SupabaseClient<Database>,
  writerUid: string
): Promise<number> {
  return repo.countRecipesByWriter(client, writerUid);
}
