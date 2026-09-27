import { throwApiError } from "@/lib/errors/api-client";
import { RecipeLikeResult } from "./types";

export async function setRecipeLike(recipeId: string, liked: boolean): Promise<RecipeLikeResult> {
  const res = await fetch(`/api/recipes/${recipeId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ liked }),
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
