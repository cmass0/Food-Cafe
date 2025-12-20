export async function toggleRecipeBookmark(
  recipeId: string,
  currentlyBookmarked: boolean
): Promise<{ bookmarked: boolean }> {
  const res = await fetch(`/api/recipes/${recipeId}/bookmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentlyBookmarked }),
  });

  if (!res.ok) {
    throw new Error(`Failed to toggle bookmark: ${res.status}`);
  }

  return res.json();
}
