import { Database } from "@/types/supabase";

export type ComboLikeRow = Database["public"]["Tables"]["combo_likes"]["Row"];
export type ComboLikeInsert = Database["public"]["Tables"]["combo_likes"]["Insert"];
export type ComboLikeUpdate = Database["public"]["Tables"]["combo_likes"]["Update"];

export interface ComboLike {
  userId: string;
  comboId: string;
  createdAt: string;
}

export type TopCombo = {
  id: string;
  title: string;
  summary: string;
  image: string | null;
  likeCount: number;
  viewCount: number;
  writerUid: string | null;
  writerName: string | null;
};

export type TopComboRow = {
  created_at: string;
  image: string;
  like_count: number;
  like_delta: number;
  combo_id: string;
  summary: string;
  title: string;
  view_count: number;
  writer_name: string;
  writer_uid: string;
};

export type ToggleComboLike = {
  liked: boolean;
  likeCount: number;
};
