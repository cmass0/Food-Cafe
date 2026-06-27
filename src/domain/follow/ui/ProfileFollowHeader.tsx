"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import { useState } from "react";

import FollowButton from "./FollowButton";

type Props = {
  targetUserId: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
  initialFollowingCount: number;
  canFollow: boolean;
  showButton: boolean;
};

export default function ProfileFollowHeader({
  targetUserId,
  displayName,
  email,
  photoUrl,
  initialIsFollowing,
  initialFollowerCount,
  initialFollowingCount,
  canFollow,
  showButton,
}: Props) {
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [followingCount, setFollowingCount] = useState(initialFollowingCount);

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
          <div className="text-gray-500">{email ?? "-"}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            팔로워 {followerCount}
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            팔로잉 {followingCount}
          </div>
        </div>
      </div>
      {showButton ? (
        <FollowButton
          targetUserId={targetUserId}
          initialIsFollowing={initialIsFollowing}
          canFollow={canFollow}
          onCountsChange={(counts) => {
            setFollowerCount(counts.followerCount);
            setFollowingCount(counts.followingCount);
          }}
        />
      ) : null}
    </div>
  );
}
