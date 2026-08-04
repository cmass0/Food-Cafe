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
import { buildPostContentHtml, buildPostContentText } from "./ui/PostContentHtml";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 10;
const MAX_JSON_CHARS = 200_000;
const RICH_CONTENT_PATTERN = /<(?:img|iframe)\b|class="youtube-link-card"/i;

export type PostAuthor = {
  uid: string;
  name: string;
};

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
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    category: row.category as Post["category"],
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
    sort: parsed.sort,
    writerUid: parsed.writerUid,
    category: parsed.category,
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
  author: PostAuthor
): Promise<Post> {
  const contentJson = parseContentJson(input.content_json);
  const parsed = postInsertSchema.parse({ ...input, content_json: contentJson });
  const contentHtml = buildPostContentHtml(parsed.content_json);
  const contentText = buildPostContentText(parsed.content_json);
  assertPostContentIsNotEmpty(contentText, contentHtml);

  const writerName = author.name.trim();
  if (!author.uid || !writerName) {
    throw new Error("작성자 정보를 확인할 수 없습니다.");
  }

  const payload: PostInsertDB = {
    title: parsed.title,
    category: parsed.category,
    content_json: parsed.content_json,
    content_html: contentHtml,
    content_text: contentText,
    writer_uid: author.uid,
    writer_name: writerName.slice(0, 120),
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
  const contentJson =
    input.content_json === undefined ? undefined : parseContentJson(input.content_json);
  const parsed = postUpdateSchema.parse({
    ...input,
    ...(contentJson === undefined ? {} : { content_json: contentJson }),
  });
  const payload: PostUpdateDB = { ...parsed };

  if (contentJson !== undefined) {
    const contentHtml = buildPostContentHtml(contentJson);
    const contentText = buildPostContentText(contentJson);
    assertPostContentIsNotEmpty(contentText, contentHtml);
    payload.content_html = contentHtml;
    payload.content_text = contentText;
  }

  const row = await repository.updatePostRecordByOwner(client, id, writerUid, payload);

  return row ? mapRowToPost(row) : null;
}

function parseContentJson(contentJson: PostCreateInput["content_json"]) {
  const serialized =
    typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson);

  if (!serialized.trim()) {
    throw new Error("내용을 입력해 주세요.");
  }
  if (serialized.length > MAX_JSON_CHARS) {
    throw new Error("본문은 200KB 이하로 작성해 주세요.");
  }

  if (typeof contentJson !== "string") return contentJson;

  try {
    return JSON.parse(contentJson);
  } catch {
    throw new Error("유효하지 않은 게시글 형식입니다.");
  }
}

function assertPostContentIsNotEmpty(contentText: string, contentHtml: string): void {
  if (!contentText && !RICH_CONTENT_PATTERN.test(contentHtml)) {
    throw new Error("내용을 입력해 주세요.");
  }
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
