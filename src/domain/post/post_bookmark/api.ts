import { throwApiError } from "@/lib/domain/api/error";

import type { PostBookmarkStatus, TogglePostBookmark } from "./types";

export async function fetchPostBookmarkStatus(
  postId: string,
  signal?: AbortSignal
): Promise<PostBookmarkStatus> {
  const response = await fetch(`/api/posts/${postId}/bookmark`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}

export async function togglePostBookmark(postId: string): Promise<TogglePostBookmark> {
  const response = await fetch(`/api/posts/${postId}/bookmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}
