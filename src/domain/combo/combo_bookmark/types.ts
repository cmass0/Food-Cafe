import { Database } from "@/types/supabase";

export type ComboBookmarkRow = Database["public"]["Tables"]["combo_bookmarks"]["Row"];
export type ComboBookmarkInsert = Database["public"]["Tables"]["combo_bookmarks"]["Insert"];
export type ComboBookmarkUpdate = Database["public"]["Tables"]["combo_bookmarks"]["Update"];

export type ComboBookmarkResult = {
  bookmarked: boolean;
  bookmarkCount: number;
};
