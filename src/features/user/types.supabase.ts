import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type UserRow = Tables<"users">;
export type UserInsert = TablesInsert<"users">;
export type UserUpdate = TablesUpdate<"users">;

