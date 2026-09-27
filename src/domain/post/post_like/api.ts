import { throwApiError } from "@/lib/errors/api-client";

import type { PostLikeResult, PostLikeStatus } from "./types";

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

export async function setPostLike(postId: string, liked: boolean): Promise<PostLikeResult> {
  const response = await fetch(`/api/posts/${postId}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ liked }),
  });
  if (!response.ok) await throwApiError(response);
  return response.json();
}
