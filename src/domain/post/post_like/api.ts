import { throwApiError } from "@/lib/domain/api/error";

import type { PostLikeStatus, TogglePostLike } from "./types";

export async function fetchPostLikeStatus(
  postId: string,
  signal?: AbortSignal
): Promise<PostLikeStatus> {
  const response = await fetch(`/api/posts/${postId}/like`, {
    cache: "no-store",
    signal,
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}

export async function togglePostLike(postId: string): Promise<TogglePostLike> {
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}
