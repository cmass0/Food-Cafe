export async function listRecipes(params?: { limit?: number; cursor?: string; writerUid?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.writerUid) qs.set("writerUid", params.writerUid);
  const res = await fetch(`/api/recipes${qs.size ? `?${qs.toString()}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to list recipes: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function createRecipe(body: unknown) {
  const res = await fetch(`/api/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create recipe: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function getRecipe(id: string) {
  const res = await fetch(`/api/recipes/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to get recipe: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function updateRecipe(id: string, body: unknown) {
  const res = await fetch(`/api/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update recipe: ${res.status}`);
  const json = await res.json();
  return json.data;
}

export async function deleteRecipe(id: string) {
  const res = await fetch(`/api/recipes/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete recipe: ${res.status}`);
}
