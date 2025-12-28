
export async function toggleRecipeLike(
  recipeId: string
): Promise<{ liked: boolean; likeCount: number | null }> {
  const res = await fetch(`/api/recipes/${recipeId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to toggle like: ${res.status}`);
  }

  return res.json();
}
