export async function listUsers(params?: { limit?: number; page?: number; offset?: number }) {
  const qs = new URLSearchParams();
  if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
  if (typeof params?.page === "number") qs.set("page", String(params.page));
  if (typeof params?.offset === "number") qs.set("offset", String(params.offset));
  const res = await fetch(`/api/users${qs.size ? `?${qs.toString()}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to list users: ${res.status}`);
  const json = await res.json();
  return json.data;
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
  if (res.status === 404) return null;
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

export async function findUserByUsername(username: string) {
  const qs = new URLSearchParams({ username });
  const res = await fetch(`/api/users?${qs.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to find user by username: ${res.status}`);
  return res.json();
}
