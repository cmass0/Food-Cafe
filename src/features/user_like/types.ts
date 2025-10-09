import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type UserLikeRow    = Tables<"user_likes">;
export type UserLikeInsert = TablesInsert<"user_likes">;
export type UserLikeUpdate = TablesUpdate<"user_likes">;

export interface UserLike {
  userId: string;
  recipeId: string;
  createdAt:string; 
}

export function toUserLike(row: UserLikeRow): UserLike {
  return {
    userId: row.user_id,
    recipeId: row.recipe_id,
    createdAt: row.created_at ?? "",
  };
}
