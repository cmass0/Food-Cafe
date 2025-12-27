import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import * as repository from "./repository";
import { comboListOptionsSchema } from "./schema";
import { Combo, ComboListOptions, ComboListResult, ComboRow } from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function mapRowToCombination(row: ComboRow): Combo {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    steps: row.steps,
    items: row.items,
    tags: row.tags,
    difficulty: row.difficulty,
    timeMinutes: row.time_minutes,
    toolRequired: row.tool_required,
    image: row.image,
    likeCount: row.like_count,
    viewCount: row.view_count,
    commentCount: row.comment_count,
    writerUid: row.writer_uid,
    writerName: row.writer_name,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
  //  id: string;
  // title: string;
  // summary: string | null;
  // steps: any[] | null;
  // WriterUid: string | null;
  // creatorName: string | null;
  // creatorEmail: string | null;
  // recipeIds: string[];
  // likeCount: number;
  // viewCount: number;
  // createdAt: Date;
  // updatedAt: Date;
  // liked?: boolean;
  // bookmarked?: boolean;
}

export async function listCombos(
  client: SupabaseClient<Database>,
  options?: ComboListOptions
): Promise<ComboListResult> {
  const parsed = comboListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);

  const { items: rows, total: rowtotal } = await repository.fetchCombos(client, {
    limit,
    offset,
    tags: parsed.tag,
    search: parsed.search,
    writerUid: parsed.writerUid,
  });

  return;
}
