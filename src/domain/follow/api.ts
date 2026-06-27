import { throwApiError } from "@/lib/domain/api/error";

// 팔로우 토글 응답
// 다른 카운터(Like/Bookmark) 응답과 동일한 구조 — 새 상태와 카운트를 함께 받음
export type ToggleFollowResponse = {
  following: boolean;
  followerCount: number;
  followingCount: number;
};

// 팔로우/언팔로우 토글
// 응답에 새 follower/following 카운트가 포함되므로 router.refresh() 없이 setState만으로 갱신 가능
export async function toggleFollow(targetUserId: string): Promise<ToggleFollowResponse> {
  const res = await fetch(`/api/follow/${targetUserId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    await throwApiError(res);
  }

  return res.json();
}
