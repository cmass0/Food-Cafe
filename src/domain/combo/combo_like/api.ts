export async function toggleComboLike(
  comboId: string
): Promise<{ liked: boolean; likeCount: number | null }> {
  const res = await fetch(`/api/combos/${comboId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to toggle like: ${res.status}`);
  }

  return res.json();
}
