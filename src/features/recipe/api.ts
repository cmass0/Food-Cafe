

export async function listRecipes(
  params?: {
    limit?: number;
    page?: number;
    writerUid?: string;
    tag?: string;
    search?: string;
  }
) {
  const qs = new URLSearchParams();
  if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
  if (typeof params?.page === "number") qs.set("page", String(params.page));
  if (params?.writerUid) qs.set("writerUid", params.writerUid);
  if (params?.tag) qs.set("tag", params.tag);
  if (params?.search) qs.set("search", params.search);
  const res = await fetch(`/api/recipes${qs.size ? `?${qs.toString()}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to list recipes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

async function throwApiError(res: Response): Promise<never> {
  try {
    const data = await res.json();
    const message =
      data?.details?.message ||
      data?.details?.hint ||
      data?.details ||
      data?.message ||
      data?.error ||
      res.statusText ||
      `Request failed: ${res.status}`;
    throw new Error(message);
  } catch {
    throw new Error(res.statusText || `Request failed: ${res.status}`);
  }
}

export async function createRecipe(body: unknown) {
  const res = await fetch(`/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function getRecipe(id: string) {
  const res = await fetch(`/api/recipes/${id}`, { cache: "no-store" });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function updateRecipe(id: string, body: unknown) {
  const res = await fetch(`/api/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) await throwApiError(res);
  const json = await res.json();
  return json.data;
}

export async function deleteRecipe(id: string) {
  const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) await throwApiError(res);
}
