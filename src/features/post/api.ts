export async function listPosts(params?: { limit?: number; cursor?: string; writerUid?: string; type?: string }) {
  const qs = new URLSearchParams();
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.cursor) qs.set("cursor", params.cursor);
  if (params?.writerUid) qs.set("writerUid", params.writerUid);
  if (params?.type) qs.set("type", params.type);
  const res = await fetch(`/api/posts${qs.size ? `?${qs.toString()}` : ""}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to list posts: ${res.status}`);
  return res.json();
}

export async function createPost(body: any) {
  const res = await fetch(`/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create post: ${res.status}`);
  return res.json();
}

export async function getPost(id: string) {
  const res = await fetch(`/api/posts/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to get post: ${res.status}`);
  return res.json();
}

export async function updatePost(id: string, body: any) {
  const res = await fetch(`/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update post: ${res.status}`);
  return res.json();
}

export async function deletePost(id: string) {
  const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`Failed to delete post: ${res.status}`);
  return res.text();
}

