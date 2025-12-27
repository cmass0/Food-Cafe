import { UserRow } from "../user/types";

export type FollowUserRow = {
  created_at: string;
  follower: UserRow | null;
};

export type FollowingUserRow = {
  created_at: string;
  following: UserRow | null;
};

export type FollowListOptions = {
  limit?: number;
  page?: number;
};

export type FollowFetchParams = {
  limit: number;
  offset: number;
};

export type FollowListResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};
