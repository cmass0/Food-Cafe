import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type ProfileRow = Tables<"profiles">;
export type ProfileInsertDB = TablesInsert<"profiles">;
export type ProfileUpdateDB = TablesUpdate<"profiles">;

export type UserListResult = {
  items: ProfileRow[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type UserListOptions = {
  limit?: number;
  page?: number;
  username?: string;
};

export type UserUpdate = {
  display_name?: string | null;
  photo_url?: string | null;
};

export type FetchUsersParams = {
  limit: number;
  offset: number;
  username?: string;
};
