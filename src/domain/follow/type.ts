import type { ProfileRow } from "../user/types";

export type FollowListType = "followers" | "following";

export type FollowProfile = Pick<ProfileRow, "id" | "display_name" | "photo_url">;

export type FollowListItem = {
  followedAt: string;
  user: FollowProfile;
};

export type FollowListOptions = {
  limit?: number;
  page?: number;
};

export type FollowFetchParams = {
  limit: number;
  offset: number;
};

export type FollowListResult = {
  items: FollowListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type FollowListResponse = FollowListResult & {
  type: FollowListType;
};
