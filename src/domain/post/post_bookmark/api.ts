import { throwApiError } from "@/lib/errors/api-client";

import type { PostBookmarkResult, PostBookmarkStatus } from "./types";

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

export async function setPostBookmark(
  postId: string,
  bookmarked: boolean
): Promise<PostBookmarkResult> {
  const response = await fetch(`/api/posts/${postId}/bookmark`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookmarked }),
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}
