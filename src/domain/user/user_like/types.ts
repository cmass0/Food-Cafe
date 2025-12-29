import type { Database } from "@/types/supabase";

export type UserLikeRow = Database["public"]["Tables"]["recipe_likes"]["Row"];
export type UserLikeInsert = Database["public"]["Tables"]["recipe_likes"]["Insert"];
export type UserLikeUpdate = Database["public"]["Tables"]["recipe_likes"]["Update"];

export interface UserLike {
  userId: string;
  recipeId: string;
  createdAt: string;
}

export function toUserLike(row: UserLikeRow): UserLike {
  return {
    userId: row.user_id,
    recipeId: row.recipe_id,
    createdAt: row.created_at ?? "",
  };
}

export type ToggleLikeRecipe = {
  liked: boolean;
  likeCount: number;
};

export type TopRecipe = {
  recipeId: string;
  title: string;
  summary: string;
  image: string | null;
  likeCount: number;
  viewCount: number;
  writerUid: string | null;
  writerName: string | null;
};
