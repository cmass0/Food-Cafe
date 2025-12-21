import type { Database, Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export type UserLikeRow = Tables<"user_likes">;
export type UserLikeInsert = TablesInsert<"user_likes">;
export type UserLikeUpdate = TablesUpdate<"user_likes">;
export type TopRecipeRow =
  Database["public"]["Functions"]["get_top_recipes_by_recent_likes"]["Returns"][number];


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

export type TopRecipe = {
  recipeId: string;
  likeDelta: number;
  title: string;
  summary: string;
  image: string | null;
  likeCount: number;
  viewCount: number;
  writerUid: string | null;
  writerName: string | null;
};



export function mapTopRecipe(row: TopRecipeRow): TopRecipe {
  return {
    recipeId: row.recipe_id,
    likeDelta: row.like_delta,
    title: row.title,
    summary: row.summary,
    image: row.image,
    likeCount: row.like_count,
    viewCount: row.view_count,
    writerUid: row.writer_uid,
    writerName: row.writer_name,
  };
}


