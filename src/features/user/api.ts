export async function listUsers(params?: { limit?: number; cursor?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursor) qs.set("cursor", params.cursor);
  const res = await fetch(`/api/users${qs.size ? `?${qs.toString()}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to list users: ${res.status}`);
  return res.json();
}

export async function createUser(body: any) {
  const res = await fetch(`/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create user: ${res.status}`);
  return res.json();
}

export async function getUser(id: string) {
  const res = await fetch(`/api/users/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to get user: ${res.status}`);
  return res.json();
}

export async function updateUser(id: string, body: any) {
  const res = await fetch(`/api/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update user: ${res.status}`);
  return res.json();
}

export async function deleteUser(id: string) {
  const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete user: ${res.status}`);
  return res.text();
}

