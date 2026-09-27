import { throwApiError } from "@/lib/errors/api-client";

import type { FollowListResponse, FollowListType, MentionCandidateResponse } from "./types";

// 팔로우 지정 응답
// 다른 카운터(Like/Bookmark) 응답과 동일한 구조 — 새 상태와 카운트를 함께 받음
export type FollowResult = {
  following: boolean;
  followerCount: number;
};

export type FollowStatusResponse = {
  following: boolean;
};

// 팔로우(true)·언팔로우(false)를 지정한다. 같은 요청을 반복해도 결과가 같다.
// 응답에 새 follower 카운트가 포함되므로 router.refresh() 없이 setState만으로 갱신 가능
export async function setFollow(targetUserId: string, following: boolean): Promise<FollowResult> {
  const res = await fetch(`/api/follow/${targetUserId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ following }),
  });

  if (!res.ok) {
    await throwApiError(res);
  }

  return res.json();
}

export async function fetchFollowStatus(
  targetUserId: string,
  signal?: AbortSignal
): Promise<FollowStatusResponse> {
  const res = await fetch(`/api/follow/${targetUserId}`, { signal });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function fetchFollowList(
  targetUserId: string,
  type: FollowListType,
  page: number,
  limit: number,
  signal?: AbortSignal
): Promise<FollowListResponse> {
  const params = new URLSearchParams({ type, page: String(page), limit: String(limit) });
  const res = await fetch(`/api/follow/${targetUserId}/list?${params.toString()}`, { signal });
  if (!res.ok) await throwApiError(res);
  return res.json();
}

export async function fetchMentionCandidates(
  query: string,
  page: number,
  limit: number,
  signal?: AbortSignal
): Promise<MentionCandidateResponse> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });
  const res = await fetch(`/api/mentions/candidates?${params.toString()}`, { signal });
  if (!res.ok) await throwApiError(res);
  return res.json();
}
