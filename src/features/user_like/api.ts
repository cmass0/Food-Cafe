
export async function toggleRecipeLike(
  recipeId: string,
  currentlyLiked: boolean
): Promise<{ liked: boolean }> {
  const res = await fetch(`/api/recipes/${recipeId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentlyLiked }),
  });

  if (!res.ok) {
    throw new Error(`Failed to toggle like: ${res.status}`);
  }

  return res.json();
}