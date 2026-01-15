import { Database } from "@/types/supabase";

export type UserBookmarkRow = Database["public"]["Tables"]["recipe_bookmarks"]["Row"];
export type UserBookmarkInsert = Database["public"]["Tables"]["recipe_bookmarks"]["Insert"];
export type UserBookmarkUpdate = Database["public"]["Tables"]["recipe_bookmarks"]["Update"];

export type ToggleRecipeBookmark = {
  bookmarked: boolean;
  bookmarkCount: number;
};

export type UserRecipeBookmarkOptions = {
  userId: string;
  recipeId: string;
  currentlyBookmarked: boolean;
};
