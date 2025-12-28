import { throwApiError } from "@/lib/domain/api/error";
import { ToggleComboLike } from "./types";

export async function toggleComboLike(comboId: string): Promise<ToggleComboLike> {
  const res = await fetch(`/api/combos/${comboId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    await throwApiError(res);
  }

  return res.json();
}
