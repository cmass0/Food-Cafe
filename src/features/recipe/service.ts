import {
  recipeInsertSchema,
  recipeListOptionsSchema,
  recipeUpdateSchema,
} from "./schema";
import * as repository from "./repository";
import type {
  Recipe,
  RecipeInsertInput,
  RecipeListOptions,
  RecipeListResult,
  RecipeSupabaseClient,
  RecipeUpdateInput,
} from "./types";

function normaliseInsertPayload(payload: RecipeInsertInput): RecipeInsertInput {
  return {
    ...payload,
    images: payload.images ?? [],
    tags: payload.tags ?? [],
  };
}

function normaliseUpdatePayload(payload: RecipeUpdateInput): RecipeUpdateInput {
  return {
    ...payload,
    images: payload.images ?? undefined,
    tags: payload.tags ?? undefined,
  };
}

export async function listRecipes(
  client: RecipeSupabaseClient,
  options?: RecipeListOptions
): Promise<RecipeListResult> {
  const parsed = recipeListOptionsSchema.parse(options ?? {});
  return repository.listRecipes(client, parsed);
}

export async function getRecipe(
  client: RecipeSupabaseClient,
  id: string
): Promise<Recipe | null> {
  return repository.getRecipe(client, id);
}

export async function createRecipe(
  client: RecipeSupabaseClient,
  input: RecipeInsertInput
): Promise<Recipe> {
  const parsed = normaliseInsertPayload(recipeInsertSchema.parse(input));
  return repository.createRecipe(client, parsed);
}

export async function updateRecipe(
  client: RecipeSupabaseClient,
  id: string,
  patch: RecipeUpdateInput
): Promise<Recipe> {
  const parsed = normaliseUpdatePayload(recipeUpdateSchema.parse(patch));
  return repository.updateRecipe(client, id, parsed);
}

export async function removeRecipe(
  client: RecipeSupabaseClient,
  id: string
): Promise<void> {
  await repository.removeRecipe(client, id);
}

