import { postInsertSchema, postListOptionsSchema, postUpdateSchema } from "./schema";
import * as repository from "./repository";
import type {
  Post,
  PostCursorFilter,
  PostInsertDB,
  PostRow,
  PostSupabaseClient,
  PostUpdateDB,
  PostListOptions,
  PostListResult,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) return DEFAULT_LIMIT;
  const truncated = Math.trunc(limit);
  if (truncated < 1) return 1;
  if (truncated > MAX_LIMIT) return MAX_LIMIT;
  return truncated;
}

function mapRowToPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    writerName: row.writer_name,
    writerUid: row.writer_uid,
    number: row.number ?? null,
    check: row.view_count ?? 0,
    type: row.type ?? "board",
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function buildInsertPayload(
  input: ReturnType<typeof postInsertSchema.parse>,
  writerUid: string
): PostInsertDB {
  return {
    title: input.title,
    content: input.content,
    writer_name: input.writerName,
    writer_uid: writerUid,
    type: input.type ?? "board",
  };
}

function buildUpdatePayload(parsed: ReturnType<typeof postUpdateSchema.parse>): PostUpdateDB {
  const payload: PostUpdateDB = {};
  if (parsed.title !== undefined) payload.title = parsed.title;
  if (parsed.content !== undefined) payload.content = parsed.content;
  if (parsed.writerName !== undefined) payload.writer_name = parsed.writerName;
  if (parsed.type !== undefined) payload.type = parsed.type;
  return payload;
}

function parseCursor(cursor?: string | null): PostCursorFilter | null {
  if (!cursor) return null;
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const payload = JSON.parse(decoded) as { created_at?: string; id?: string };
    if (!payload.created_at || !payload.id) return null;
    return { createdAt: payload.created_at, id: payload.id };
  } catch {
    return null;
  }
}

function encodeCursor(row: PostRow): string {
  const payload = JSON.stringify({ created_at: row.created_at, id: row.id });
  return Buffer.from(payload).toString("base64url");
}

export async function listPosts(
  client: PostSupabaseClient,
  options?: PostListOptions
): Promise<PostListResult> {
  const parsed = postListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit);
  const rows = await repository.fetchPosts(client, {
    limit: limit + 1,
    cursor: parseCursor(parsed.cursor),
    writerUid: parsed.writerUid,
    type: parsed.type,
    search: parsed.search,
  });

  const hasExtra = rows.length > limit;
  const items = hasExtra ? rows.slice(0, limit) : rows;
  const cursorRow = hasExtra ? rows[limit] : null;

  return {
    items: items.map(mapRowToPost),
    nextCursor: cursorRow ? encodeCursor(cursorRow) : null,
  };
}

export async function getPost(
  client: PostSupabaseClient,
  id: string
): Promise<Post | null> {
  const row = await repository.selectPostById(client, id);
  return row ? mapRowToPost(row) : null;
}

export async function createPost(
  client: PostSupabaseClient,
  input: unknown
): Promise<Post> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("로그인이 필요합니다.");

  const parsed = postInsertSchema.parse(input);
  const payload = buildInsertPayload(parsed, user.id);
  const row = await repository.insertPostRecord(client, payload);
  return mapRowToPost(row);
}

export async function updatePost(
  client: PostSupabaseClient,
  id: string,
  input: unknown
): Promise<Post | null> {
  const parsed = postUpdateSchema.parse(input);

  if (parsed.checkIncrement) {
    await repository.incrementPostViewCount(client, id);
  }

  const updatePayload = buildUpdatePayload(parsed);
  let row: PostRow | null = null;

  if (Object.keys(updatePayload).length > 0) {
    const {
      data: { user },
      error,
    } = await client.auth.getUser();
    if (error) throw error;
    if (!user) throw new Error("로그인이 필요합니다.");
    row = await repository.updatePostRecordByOwner(client, id, user.id, updatePayload);
  } else {
    row = await repository.selectPostById(client, id);
  }

  return row ? mapRowToPost(row) : null;
}

export async function removePost(client: PostSupabaseClient, id: string): Promise<void> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("로그인이 필요합니다.");
  await repository.deletePostRecord(client, id, user.id);
}

export async function incrementPostView(
  client: PostSupabaseClient,
  id: string
): Promise<Post | null> {
  await repository.incrementPostViewCount(client, id);
  return getPost(client, id);
}

