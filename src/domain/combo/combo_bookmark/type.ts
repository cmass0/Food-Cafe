 import { Database } from "@/types/supabase";

export type ComboBookmarkRow = Database["public"]["Tables"]["combo_bookmarks"]["Row"];
export type ComboBookmarkInsert = Database["public"]["Tables"]["combo_bookmarks"]["Insert"];
export type ComboBookmarkUpdate = Database["public"]["Tables"]["combo_bookmarks"]["Update"];

export type ComboBookmark = {
  bookmarked: boolean;
  total: number;
};

export type ComboBookmarkOptions = {
  userId: string;
  comboId: string;
  currentlyBookmarked: boolean;
};

export type ToggleComboBookmark = {
  bookmarked: boolean;
};
