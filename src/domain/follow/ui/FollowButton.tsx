"use client";

import { Button } from "@/components/ui/button";
import { toggleFollow } from "@/domain/follow/api";
import * as React from "react";

type Props = {
  targetUserId: string;
  initialIsFollowing: boolean;
  // 카운트 표시를 같은 클라이언트 트리에서 관리하기 위해 콜백으로 위임
  // 응답에 카운트가 포함되므로 부모 상태에 그대로 반영하면 router.refresh() 불필요
  onCountsChange?: (counts: { followerCount: number; followingCount: number }) => void;
  canFollow?: boolean;
  className?: string;
};

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  onCountsChange,
  canFollow = true,
  className,
}: Props) {
  const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);
  const [isPending, startTransition] = React.useTransition();

  const handleToggle = React.useCallback(() => {
    if (!canFollow || isPending) return;

    startTransition(async () => {
      try {
        const { following, followerCount, followingCount } = await toggleFollow(targetUserId);
        setIsFollowing(following);
        // 부모(프로필 헤더)가 follower/following 카운트를 실시간으로 갱신할 수 있도록 전달
        onCountsChange?.({ followerCount, followingCount });
      } catch (error) {
        console.error("[follow] toggle failed:", error);
      }
    });
  }, [canFollow, isPending, onCountsChange, targetUserId]);

  const buttonLabel = isFollowing ? "언팔로우" : "팔로우";

  return (
    <div className="flex items-center">
      <Button
        type="button"
        onClick={handleToggle}
        className={className}
        disabled={!canFollow || isPending}
      >
        {buttonLabel}
      </Button>
    </div>
  );
}
