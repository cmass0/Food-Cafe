import { Database } from "@/types/supabase";

export type RecipeBookmarkRow = Database["public"]["Tables"]["recipe_bookmarks"]["Row"];
export type RecipeBookmarkInsert = Database["public"]["Tables"]["recipe_bookmarks"]["Insert"];
export type RecipeBookmarkUpdate = Database["public"]["Tables"]["recipe_bookmarks"]["Update"];

export type RecipeBookmarkResult = {
  bookmarked: boolean;
  bookmarkCount: number;
};
