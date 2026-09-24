import { throwApiError } from "@/lib/domain/api/error";
import { RecipeBookmarkResult } from "./type";

export async function setRecipeBookmark(
  recipeId: string,
  bookmarked: boolean
): Promise<RecipeBookmarkResult> {
  const res = await fetch(`/api/recipes/${recipeId}/bookmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookmarked }),
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
