import { throwApiError } from "@/lib/domain/api/error";
import { ComboListResult, ComboRow, ComboSearchField } from "./types";

export async function listCombos(params?: {
  limit?: number;
  page?: number;
  writerUid?: string;
  search?: string;
  searchField?: ComboSearchField;
}): Promise<ComboListResult> {
  const qs = new URLSearchParams();
  if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
  if (typeof params?.page === "number") qs.set("page", String(params.page));
  if (params?.writerUid) qs.set("writerUid", params.writerUid);
  if (params?.search) qs.set("search", params.search);
  if (params?.searchField) qs.set("searchField", params.searchField);

  const res = await fetch(`/api/combos${qs ? `?${qs.toString()}` : ""}`, {
    cache: "no-store",
  });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function fetchComboById(comboId: string): Promise<ComboRow> {
  const res = await fetch(`/api/combos/${comboId}`, { cache: "no-store" });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function fetchComboStatus(comboId: string): Promise<{
  liked: boolean;
  bookmarked: boolean;
}> {
  const res = await fetch(`/api/combos/${comboId}/status`, { cache: "no-store" });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function createCombo(body: unknown) {
  const res = await fetch(`/api/combos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function updateCombo(id: string, body: unknown) {
  const res = await fetch(`/api/combos/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function deleteCombo(id: string) {
  const res = await fetch(`/api/combos/${id}`, { method: "DELETE" });
  if (!res.ok) await throwApiError(res);
}
