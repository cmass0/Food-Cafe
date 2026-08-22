"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useState } from "react";

import FollowButton from "./FollowButton";
import FollowListDialog from "./FollowListDialog";

type Props = {
  targetUserId: string;
  displayName: string | null;
  photoUrl: string | null;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
  initialFollowingCount: number;
  showButton: boolean;
};

export default function ProfileFollowHeader({
  targetUserId,
  displayName,
  photoUrl,
  initialIsFollowing,
  initialFollowerCount,
  initialFollowingCount,
  showButton,
}: Props) {
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);

  return (
    <div className="-mt-9 flex items-end justify-between">
      <div className="flex items-end gap-4">
        <Avatar className="h-20 w-20 border bg-background md:h-24 md:w-24">
          {photoUrl ? <AvatarImage src={photoUrl} alt="프로필 이미지" /> : <User />}
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-2xl font-semibold">{displayName ?? "-"}</div>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <FollowListDialog targetUserId={targetUserId} type="followers" count={followerCount} />
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <FollowListDialog
              targetUserId={targetUserId}
              type="following"
              count={initialFollowingCount}
            />
          </div>
        </div>
      </div>
      {showButton ? (
        <FollowButton
          targetUserId={targetUserId}
          initialIsFollowing={initialIsFollowing}
          onFollowerCountChange={setFollowerCount}
        />
      ) : null}
    </div>
  );
}
