import { throwApiError } from "@/lib/errors/api-client";
import { ComboBookmarkResult } from "./types";

export async function setComboBookmark(
  comboId: string,
  bookmarked: boolean
): Promise<ComboBookmarkResult> {
  const res = await fetch(`/api/combos/${comboId}/bookmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookmarked }),
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
