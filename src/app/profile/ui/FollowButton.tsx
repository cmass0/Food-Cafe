"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { fetchFollowStatus, setFollow } from "@/domain/follow/api";
import { isUnauthorizedApiError } from "@/lib/errors/api-client";
import * as React from "react";

type Props = {
  targetUserId: string;
  initialIsFollowing: boolean;
  // 카운트 표시를 같은 클라이언트 트리에서 관리하기 위해 콜백으로 위임
  // 응답에 카운트가 포함되므로 부모 상태에 그대로 반영하면 router.refresh() 불필요
  onFollowerCountChange?: (followerCount: number) => void;
  className?: string;
};

function getReturnPath() {
  const current = new URL(window.location.href);
  return `${current.pathname}${current.search}${current.hash}`;
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  onFollowerCountChange,
  className,
}: Props) {
  const [isFollowing, setIsFollowing] = React.useState(initialIsFollowing);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  React.useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing, targetUserId]);

  React.useEffect(() => {
    if (!user?.id) {
      setIsFollowing(false);
      return;
    }

    const controller = new AbortController();
    void fetchFollowStatus(targetUserId, controller.signal)
      .then((status) => {
        if (!controller.signal.aborted) setIsFollowing(status.following);
      })
      .catch((error) => {
        if (controller.signal.aborted || isUnauthorizedApiError(error)) return;
        console.error("[follow] status failed", error);
      });
    return () => controller.abort();
  }, [targetUserId, user?.id]);

  const handleToggle = React.useCallback(() => {
    if (!user) {
      openAuthModal({ next: getReturnPath() });
      return;
    }
    if (isPending) return;

    setErrorMessage("");

    startTransition(async () => {
      try {
        const { following, followerCount } = await setFollow(targetUserId, !isFollowing);
        setIsFollowing(following);
        onFollowerCountChange?.(followerCount);
      } catch (error) {
        if (isUnauthorizedApiError(error)) {
          openAuthModal({ next: getReturnPath() });
          return;
        }
        console.error("[follow] update failed:", error);
        setErrorMessage("팔로우 상태를 변경하지 못했습니다.");
      }
    });
  }, [isFollowing, isPending, onFollowerCountChange, openAuthModal, targetUserId, user]);

  const buttonLabel = isFollowing ? "언팔로우" : "팔로우";

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" onClick={handleToggle} className={className} disabled={isPending}>
        {isPending ? "처리 중..." : buttonLabel}
      </Button>
      {errorMessage ? (
        <p className="text-xs text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
