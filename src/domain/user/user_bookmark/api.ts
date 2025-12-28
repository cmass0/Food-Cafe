import { throwApiError } from "@/lib/domain/api/error";
import { ToggleRecipeBookmark } from "./type";

export async function toggleRecipeBookmark(
  recipeId: string,
  currentlyBookmarked: boolean
): Promise<ToggleRecipeBookmark> {
  const res = await fetch(`/api/recipes/${recipeId}/bookmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipeId, currentlyBookmarked }),
  });

  if (!res.ok) {
    await throwApiError(res);
  }

  const data = await res.json();

  return data;
}
