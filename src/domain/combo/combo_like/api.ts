import { throwApiError } from "@/lib/domain/api/error";
import { ComboLikeResult } from "./types";

export async function setComboLike(comboId: string, liked: boolean): Promise<ComboLikeResult> {
  const res = await fetch(`/api/combos/${comboId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ liked }),
  });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
