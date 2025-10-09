import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables, TablesInsert, TablesUpdate } from "@/types/supabase";


export type UserRow = Tables<"users">;
export type UserInsertDB = TablesInsert<"users">;
export type UserUpdateDB = TablesUpdate<"users">;
export type UserSupabaseClient = SupabaseClient<Database>;


export interface User {
  id: string;
  email: string | null;
  displayName: string;
  photoUrl: string | null;
  role: string;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string | null;
}


export interface UserListResult {
  items: User[];
  nextCursor: string | null;
}


export type UserUpdate = {
  display_name?: string | null;
  photo_url?: string | null;
};
