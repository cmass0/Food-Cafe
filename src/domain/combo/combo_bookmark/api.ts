import { throwApiError } from "@/lib/domain/api/error";
import { ToggleComboBookmark } from "./type";

export async function toggleComboBookmark(
  comboId: string,
  currentlyBookmarked: boolean
): Promise<ToggleComboBookmark> {
  const res = await fetch(`/api/combos/bookmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ comboId, currentlyBookmarked }),
  });
  if (!res.ok) {
    await throwApiError(res);
  }
  const data = await res.json();

  return data;
}
