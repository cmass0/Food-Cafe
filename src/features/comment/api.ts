export async function listComments(params?: { limit?: number; cursor?: string; type?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.type) qs.set("type", params.type);
  const res = await fetch(`/api/comments${qs.size ? `?${qs.toString()}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to list comments: ${res.status}`);
  return res.json();
}

export async function createComment(body: any) {
  const res = await fetch(`/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create comment: ${res.status}`);
  return res.json();
}

export async function getComment(id: string) {
  const res = await fetch(`/api/comments/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to get comment: ${res.status}`);
  return res.json();
}

export async function updateComment(id: string, body: any) {
  const res = await fetch(`/api/comments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update comment: ${res.status}`);
  return res.json();
}

export async function deleteComment(id: string) {
  const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete comment: ${res.status}`);
  return res.text();
}

