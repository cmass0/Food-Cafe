

export async function listPosts(
  params?: {
    limit?: number;
    page?: number;
    writerUid?: string;
    type?: string;
    search?: string;
  }
) {
  const qs = new URLSearchParams();
  if (typeof params?.limit === "number") qs.set("limit", String(params.limit));
  if (typeof params?.page === "number") qs.set("page", String(params.page));
  if (params?.writerUid) qs.set("writerUid", params.writerUid);
  if (params?.type) qs.set("type", params.type);
  if (params?.search) qs.set("search", params.search);

  const res = await fetch(`/api/posts${qs.size ? `?${qs.toString()}` : ""}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to list posts: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function createPost(body: unknown) {
  const res = await fetch(`/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to create post: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function getPost(id: string) {
  const res = await fetch(`/api/posts/${id}`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`Failed to get post: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function updatePost(id: string, body: unknown) {
  const res = await fetch(`/api/posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to update post: ${res.status}`);
  }

  const json = await res.json();
  return json.data;
}

export async function deletePost(id: string) {
  const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete post: ${res.status}`);
  }
}
