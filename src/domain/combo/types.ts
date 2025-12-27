import { Database } from "@/types/supabase";
import {} from "./types";

export type ComboRow = Database["public"]["Tables"]["combos"]["Row"];
export type ComboInsertRow = Database["public"]["Tables"]["combos"]["Insert"];
export type ComboUpdateRow = Database["public"]["Tables"]["combos"]["Update"];

export interface Combo {
  id: string;
  title: string;
  summary: string | null;
  steps: JSON | null;
  items: JSON | null;
  WriterUid: string | null;
  creatorName: string | null;
  creatorEmail: string | null;
  recipeIds: string[];
  timeMinutes: number | null;
  toolRequired: boolean;
  likeCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  liked?: boolean;
  bookmarked?: boolean;
}

export type ComboListOptions = {
  page?: number;
  limit?: number;
  tags?: string[];
  search?: string;
  writerUid?: string;
};

export type ComboListResult = {
  items: Combo[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type FetchCombosParams = {
  limit: number;
  offset: number;
  tags?: string[];
  writerUid?: string;
  search?: string;
};

export type fetchCombosResult = {
  items: ComboRow[];
  total: number;
};

export type ComboStep = {
  description: string;
};

export type InsertCombo = {
  title: string;
  summary?: string | null;
  steps: ComboStep[];
  recipeIds: string[];
  items?: any[];
  tag?: string[];
  writerUid: string | null;
  creatorName?: string | null;
  creatorEmail?: string | null;
};
