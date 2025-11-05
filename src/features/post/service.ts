import { postInsertSchema, postListOptionsSchema, postUpdateSchema } from "./schema";
import * as repository from "./repository";
import type {
  Post,
  PostInsertDB,
  PostRow,
  PostSupabaseClient,
  PostUpdateDB,
  PostListOptions,
  PostListResult,
} from "./types";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 10;

function resolveLimit(limit?: number): number {
  if (typeof limit !== "number" || Number.isNaN(limit)) return DEFAULT_LIMIT;
  const truncated = Math.trunc(limit);
  if (truncated < 1) return 1;
  if (truncated > MAX_LIMIT) return MAX_LIMIT;
  return truncated;
}

function resolveOffsetFromPage(page: number | undefined, limit: number): number {
  if (typeof page === "number" && Number.isFinite(page)) {
    const safePage = Math.max(1, Math.trunc(page));
    return (safePage - 1) * limit;
  }
  return 0;
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

export async function listPosts(
  client: PostSupabaseClient,
  options?: PostListOptions
): Promise<PostListResult> {
  const parsed = postListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit);
  const offset = resolveOffsetFromPage(parsed.page, limit);
  const { items: rows, total: rawTotal } = await repository.fetchPosts(client, {
    limit,
    offset,

    writerUid: parsed.writerUid,
    type: parsed.type,
    search: parsed.search,
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
