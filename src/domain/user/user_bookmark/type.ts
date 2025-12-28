import { Database } from "@/types/supabase";

export type UserBookmarkRow = Database["public"]["Tables"]["user_bookmarks"]["Row"];
export type UserBookmarkInsert = Database["public"]["Tables"]["user_bookmarks"]["Insert"];
export type UserBookmarkUpdate = Database["public"]["Tables"]["user_bookmarks"]["Update"];

export type ToggleRecipeBookmark = {
  bookmarked: boolean;
};

export type UserRecipeBookmarkOptions = {
  userId: string;
  recipeId: string;
  currentlyBookmarked: boolean;
};
