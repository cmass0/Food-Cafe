import { throwApiError } from "@/lib/domain/api/error";
import { ToggleLikeRecipe } from "./types";

export async function toggleRecipeLike(recipeId: string): Promise<ToggleLikeRecipe> {
  const res = await fetch(`/api/recipes/${recipeId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    await throwApiError(res);
  }
  const data = await res.json();

  return data;
}
