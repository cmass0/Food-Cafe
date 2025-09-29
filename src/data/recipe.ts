import { ZodError } from "zod";

import { getServerSupabase } from "@/lib/supabase/server";
import * as recipeService from "@/features/recipe/service";
import type {
  Recipe,
  RecipeInsertInput,
  RecipeUpdateInput,
  RecipeListOptions,
} from "@/features/recipe/types";

export type LegacyRecipe = ReturnType<typeof mapRecipeToLegacy>;

type LegacyCreateInput = {
  email?: string | null;
  name?: string | null;
  recipe?: string | null;
  summary?: string | null;
  title: string;
  image?: string | null;
  like?: number;
  check?: number;
};

type LegacyUpdateInput = {
  email?: string | null;
  name?: string | null;
  title?: string;
  summary?: string | null;
  recipe?: string | null;
  image?: string | null;
  like?: number;
  check?: number | "increment";
  lastlike?: string | Date | null;
};

function mapRecipeToLegacy(recipe: Recipe) {
  const lastLiked = recipe.lastLikedAt ? new Date(recipe.lastLikedAt) : null;

  return {
    id: recipe.id,
    idTextOld: recipe.idTextOld,
    legacyId: recipe.legacyId,
    title: recipe.title,
    summary: recipe.summary ?? "",
    recipe: recipe.recipe ?? "",
    image: recipe.image ?? null,
    images: recipe.images,
    category: recipe.category ?? null,
    tags: recipe.tags,
    likeCount: recipe.likeCount,
    viewCount: recipe.viewCount,
    like: recipe.likeCount,
    check: recipe.viewCount,
    lastlike: lastLiked,
    status: recipe.status ?? null,
    writerUid: recipe.writerUid ?? null,
    writerUidLegacy: recipe.writerUidLegacy ?? null,
    writerName: recipe.writerName ?? null,
    name: recipe.writerName ?? null,
    writerEmail: recipe.writerEmail ?? null,
    email: recipe.writerEmail ?? null,
    type: "recipe",
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    date: recipe.createdAt,
  } as const;
}

function normaliseCreateInput(payload: LegacyCreateInput): RecipeInsertInput {
  return {
    title: payload.title,
    summary: payload.summary ?? null,
    recipe: payload.recipe ?? null,
    image: payload.image ?? null,
    images: payload.image ? [payload.image] : undefined,
    writerEmail: payload.email ?? null,
    writerName: payload.name ?? null,
  };
}

function buildUpdateInput(existing: Recipe | null, values: LegacyUpdateInput): RecipeUpdateInput {
  const viewCount =
    values.check === "increment"
      ? (existing?.viewCount ?? 0) + 1
      : typeof values.check === "number"
        ? values.check
        : undefined;

  const lastLikedAt = values.lastlike
    ? values.lastlike instanceof Date
      ? values.lastlike.toISOString()
      : new Date(values.lastlike).toISOString()
    : values.lastlike;

  return {
    writerEmail: values.email ?? undefined,
    writerName: values.name ?? undefined,
    title: values.title,
    summary: values.summary,
    recipe: values.recipe,
    image: values.image,
    likeCount: values.like,
    viewCount,
    lastLikedAt,
  };
}

function rethrow(error: unknown): never {
  if (error instanceof ZodError) {
    const first = error.issues.at(0);
    throw new Error(first?.message ?? "Invalid recipe payload.");
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error("Unexpected error occurred.");
}

export async function fetchRecipes(options?: RecipeListOptions) {
  const supabase = getServerSupabase();
  const { items } = await recipeService.listRecipes(supabase, options);
  return items.map(mapRecipeToLegacy);
}

export async function fetchRecipe(id: string) {
  if (!id) return null;
  const supabase = getServerSupabase();
  const recipe = await recipeService.getRecipe(supabase, id);
  return recipe ? mapRecipeToLegacy(recipe) : null;
}

export async function addRecipe(payload: LegacyCreateInput) {
  try {
    const supabase = getServerSupabase();
    const recipe = await recipeService.createRecipe(supabase, normaliseCreateInput(payload));
    return mapRecipeToLegacy(recipe);
  } catch (error) {
    rethrow(error);
  }
}

export async function deleteARecipe(id: string) {
  const supabase = getServerSupabase();
  const recipe = await recipeService.getRecipe(supabase, id);
  if (!recipe) {
    return null;
  }
  await recipeService.removeRecipe(supabase, id);
  return mapRecipeToLegacy(recipe);
}

export async function editARecipe(id: string, payload: LegacyUpdateInput) {
  try {
    const supabase = getServerSupabase();
    const existing = await recipeService.getRecipe(supabase, id);
    const update = buildUpdateInput(existing, payload);
    const recipe = await recipeService.updateRecipe(supabase, id, update);
    return mapRecipeToLegacy(recipe);
  } catch (error) {
    rethrow(error);
  }
}

