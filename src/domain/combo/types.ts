import { Database } from "@/types/supabase";
import { z } from "zod";
import { ComboFormSchema } from "./schema";
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
  // 목록 조회에서 로그인 사용자가 누른 좋아요·북마크인지. 비로그인이면 없다.
  liked?: boolean;
  bookmarked?: boolean;
  writerUid: string | null;
  writerName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ComboListOptions = {
  page?: number;
  limit?: number;

  search?: string;
  writerUid?: string;
  searchField?: ComboSearchField;
  sort?: ComboSort;
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

  writerUid?: string;
  search?: string;
  searchField?: ComboSearchField;
  sort?: ComboSort;
};

export type ComboSearchField = "tag" | "title" | "tag_title" | "writer";
export type ComboSort = "recent" | "like" | "view";

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
};

export type ComboFormType = {
  title: string;
  summary?: string | null;
  steps: ComboSteps[] | null;
  items?: ComboItemsForm[] | null;
  tags?: string[] | null;
  tools?: string[] | null;
  difficulty: string | null;
  time_minutes: number | null;
  tools_required?: boolean;
  image?: File | null;
  writer_uid?: string | null;
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

export type ComboItemsForm =
  | {
      type: "recipe";
      recipeid: string;
      title?: string;
      summary?: string;
      image?: string | null;
    }
  | {
      type: "product";
      productName: string;
      summary?: string;
      image?: File | string | null;
    };

export type ComboItems =
  | {
      type: "recipe";
      recipeid: string;
      title?: string;
      summary?: string;
      image?: string | null;
    }
  | {
      type: "product";
      productName: string;
      summary?: string;
      image?: string | null;
    };

export type ComboFormValues = z.input<typeof ComboFormSchema>;
