import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type UserRow = Tables<"users">;
export type UserInsertDB = TablesInsert<"users">;
export type UserUpdateDB = TablesUpdate<"users">;
export type UserSupabaseClient = SupabaseClient<Database>;

export type UserListResult = {
  items: UserRow[];
  nextCursor: string | null;
};

export type UserListOptions = {
  limit?: number;
  cursor?: string;
  username?: string;
};

export type UserUpdate = {
  display_name?: string | null;
  photo_url?: string | null;
  email?: string | null;
};
