import { Database } from "@/types/supabase";
import {} from "./types";

export type ComboRow = Database["public"]["Tables"]["combos"]["Row"];
export type ComboInsertRow = Database["public"]["Tables"]["combos"]["Insert"];
export type ComboUpdateRow = Database["public"]["Tables"]["combos"]["Update"];

export interface Combos {
  id: string;
  title: string;
  summary: string | null;
  steps: ComboSteps[] | null;
  items: ComboItems[] | null;
  tags: string[];
  tools: string[] | null;
  difficulty: string | null;
  timeMinutes: number | null;
  toolRequired: boolean;
  image: string | null;
  likeCount: number;
  viewCount: number;
  commentCount: number;
  bookmarkCount: number;
  writerUid: string | null;
  writerName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ComboListOptions = {
  page?: number;
  limit?: number;
  tags?: string[];
  search?: string;
  writerUid?: string;
};

export type ComboListResult = {
  items: Combos[];
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

export type ComboInsertDb = {
  id: string;
  title: string;
  summary?: string | null;
  steps: ComboSteps[] | null;
  items?: ComboItems[] | null;
  tags?: string[] | null;
  tools?: string[] | null;
  difficulty: string | null;
  time_minutes: number | null;
  tools_required?: boolean;
  image?: string | null;
  writer_uid?: string | null;
  writer_name?: string | null;
};

export type ComboUpdateDb = {
  title?: string;
  summary?: string | null;
  steps?: ComboSteps[] | null;
  items?: ComboItems[] | null;
  tags?: string[] | null;
  tools?: string[] | null;
  difficulty?: string | null;

  time_minutes?: number | null;
  tools_required?: boolean;
  image?: string | null;
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

export type ComboSteps = {
  description: string;
};

export type ComboItems =
  | {
      type: "recipe";
      recipeid: string;
      summary?: string;
    }
  | {
      type: "product";
      productName: string;
      summary?: string;
    };
