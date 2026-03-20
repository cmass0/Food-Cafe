"use client";

import { Button } from "@/components/ui/button";
import { getBrowserSupabase } from "@/lib/supabase";
import * as React from "react";

type Props = {
  targetUserId: string;
  initialIsFollowing: boolean;
  canFollow?: boolean;
  className?: string;
};

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  canFollow = true,
  className,
}: Props) {
  const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);
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

      setIsFollowing(Boolean(data));
    });
  }, [canFollow, isPending, targetUserId]);

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
