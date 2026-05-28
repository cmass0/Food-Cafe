import { resolveLimit, resolveOffset } from "@/lib/pagination";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as repository from "./repository";
import { postInsertSchema, postListOptionsSchema, postUpdateSchema } from "./schema";
import type {
  Post,
  PostCreateInput,
  PostInsertDB,
  PostListOptions,
  PostListResult,
  PostRow,
  PostUpdateDB,
  PostUpdateInput,
} from "./types";
import { buildPostContentHtml } from "./ui/PostContentHtml";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 10;
const MAX_JSON_CHARS = 200_000;

function mapRowToPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    contentJson: row.content_json ?? null,
    contentHtml: row.content_html ?? null,
    contentText: row.content_text ?? null,
    writerName: row.writer_name,
    writerUid: row.writer_uid,
    number: row.number ?? null,
    viewCount: row.view_count ?? 0,
    commentCount: row.comment_count ?? 0,
    type: row.type ?? "board",
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export async function listPosts(
  client: SupabaseClient<Database>,
  options?: PostListOptions
): Promise<PostListResult> {
  const parsed = postListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);

  const { items: rows, total: rawTotal } = await repository.fetchPosts(client, {
    limit,
    offset,
    writerUid: parsed.writerUid,
    type: parsed.type,
    search: parsed.search,
    searchField: parsed.searchField,
  });

  const items = rows.map(mapRowToPost);
  const total = Math.max(rawTotal, offset + items.length);
  const hasMore = offset + items.length < total;

  return {
    items,
    total,
    limit,
    hasMore,
    offset,
  };
}

export async function getPost(client: SupabaseClient<Database>, id: string): Promise<Post | null> {
  const row = await repository.selectPostById(client, id);
  return row ? mapRowToPost(row) : null;
}

export async function createPost(
  client: SupabaseClient<Database>,
  input: PostCreateInput,
  writerUid: string
): Promise<Post> {
  let contentJson = input.content_json;

  // 문자열로 들어오는 경우 처리
  if (typeof contentJson === "string") {
    // 크기 제한 검사
    if (contentJson.length > MAX_JSON_CHARS) {
      throw new Error("컨텐츠의 길이가 초과되었습니다.");
    }
    // 본문 비어있는지 검사
    if (contentJson.trim() === "") {
      throw new Error("내용을 입력해 주세요.");
    }
    try {
      contentJson = JSON.parse(contentJson);
    } catch {
      throw new Error("유효하지 않은 형식입니다.");
    }
  }
  const content_html = buildPostContentHtml(contentJson);
  const parsed = postInsertSchema.parse({ ...input, content_html, content_json: contentJson });
  const payload: PostInsertDB = {
    ...parsed,
    content_text: parsed.content_text ?? null,
    type: parsed.type ?? "board",
    writer_uid: writerUid,
  };
  const row = await repository.insertPostRecord(client, payload);
  return mapRowToPost(row);
}

export async function updatePost(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string,
  input: PostUpdateInput
): Promise<Post | null> {
  let contentJson = input.content_json;

  // 문자열로 들어오는 경우 처리
  if (typeof contentJson === "string") {
    // 크기 제한 검사
    if (contentJson.length > MAX_JSON_CHARS) {
      throw new Error("컨텐츠의 길이가 초과되었습니다.");
    }
    // 본문 비어있는지 검사
    if (contentJson.trim() === "") {
      throw new Error("내용을 입력해 주세요.");
    }
    try {
      contentJson = JSON.parse(contentJson);
    } catch {
      throw new Error("유효하지 않은 형식입니다.");
    }
  }

  const payload: PostUpdateDB = postUpdateSchema.parse({
    ...input,

    ...(contentJson !== undefined
      ? { content_json: contentJson, content_html: buildPostContentHtml(contentJson) }
      : {}),
  });

  let row: PostRow | null = null;

  row = await repository.updatePostRecordByOwner(client, id, writerUid, payload);

  return row ? mapRowToPost(row) : null;
}

export async function removePost(
  client: SupabaseClient<Database>,
  id: string,
  writerUid: string
): Promise<void> {
  if (!writerUid) {
    throw new Error("UNAUTHORIZED");
  }
  await repository.deletePostRecord(client, id, writerUid);
}
