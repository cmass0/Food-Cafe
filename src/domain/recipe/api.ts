import { throwApiError } from "@/lib/domain/api/error";
import type { Recipe, RecipeListResult, RecipeSearchField } from "./types";

export async function listRecipes(params?: {
  limit?: number;
  page?: number;
  writerUid?: string;
  search?: string;
  searchField?: RecipeSearchField;
}): Promise<RecipeListResult> {
  const qs = new URLSearchParams();
  if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
  if (typeof params?.page === "number") qs.set("page", String(params.page));
  if (params?.writerUid) qs.set("writerUid", params.writerUid);
  if (params?.search) qs.set("search", params.search);
  if (params?.searchField) qs.set("searchField", params.searchField);
  

  const res = await fetch(`/api/recipes${qs.size ? `?${qs.toString()}` : ""}`, {
    cache: "no-store",
  });

  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data as RecipeListResult;
}

export async function createRecipe(body: unknown): Promise<Recipe> {
  const res = await fetch(`/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function getRecipe(id: string): Promise<Recipe> {
  const res = await fetch(`/api/recipes/${id}`, { cache: "no-store" });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function fetchRecipeStatus(id: string): Promise<{
  liked: boolean;
  bookmarked: boolean;
}> {
  const res = await fetch(`/api/recipes/${id}/status`, { cache: "no-store" });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function updateRecipe(id: string, body: unknown): Promise<Recipe> {
  const res = await fetch(`/api/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function deleteRecipe(id: string){
  const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) await throwApiError(res);
}
