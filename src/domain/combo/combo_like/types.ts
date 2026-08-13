import { Database } from "@/types/supabase";

export type ComboLikeRow = Database["public"]["Tables"]["combo_likes"]["Row"];
export type ComboLikeInsert = Database["public"]["Tables"]["combo_likes"]["Insert"];
export type ComboLikeUpdate = Database["public"]["Tables"]["combo_likes"]["Update"];

export interface ComboLike {
  userId: string;
  comboId: string;
  createdAt: string;
}

export type ToggleComboLike = {
  liked: boolean;
  likeCount: number;
};
