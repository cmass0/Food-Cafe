"use client";

import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase";
import * as React from "react";

type Props = {
  targetUserId: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
  followingCount: number;
  canFollow?: boolean;

  className?: string;
};

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  initialFollowerCount,
  followingCount,
  canFollow = true,
  className,
}: Props) {
  const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = React.useState(initialFollowerCount);
  const [isPending, startTransition] = React.useTransition();

  const handleToggle = React.useCallback(() => {
    if (!canFollow || isPending) return;

    startTransition(async () => {
      const supabase = getBrowserSupabase();
      const { data, error } = await supabase.rpc("toggle_follow", {
        p_target_id: targetUserId,
      });

      if (error) {
        console.error("[follow] toggle failed:", error);
        return;
      }

      const next = Boolean(data);
      setIsFollowing(next);
      setFollowerCount((prev) => Math.max(prev + (next ? 1 : -1), 0));
    });
  }, [canFollow, isPending, targetUserId]);

  const buttonLabel = isFollowing ? "언팔로우" : "팔로우";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="text-xs text-muted-foreground">
        <span>팔로워 {followerCount}</span>
        <span aria-hidden="true"> · </span>
        <span>팔로잉 {followingCount}</span>
      </div>
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
