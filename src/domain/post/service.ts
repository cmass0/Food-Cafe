import { resolveLimit, resolveOffset } from "@/lib/pagination";
import { managedPathsFromHtml } from "@/lib/storage/html-paths";
import { normalizeStoredImageReference } from "@/lib/storage/paths";
import { safePruneContentImages, safeRemoveContentImages } from "@/lib/storage/server";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import * as followService from "@/domain/follow/service";
import { collectMentionTargetIds } from "./mentions";
import * as repository from "./repository";
import {
  POST_CONTENT_MAX_CHARS,
  POST_CONTENT_TOO_LARGE_MESSAGE,
  postInsertSchema,
  postListOptionsSchema,
  postUpdateSchema,
} from "./schema";
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
import { extractPostText, sanitizePostHtmlForStorage } from "./content";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 10;
const RICH_CONTENT_PATTERN = /<(?:img|iframe)\b|class="youtube-link-card"/i;

// 작성자 이름은 DB Trigger(private.set_content_writer)가 프로필에서 채운다.
export type PostAuthor = {
  uid: string;
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
    bookmarkCount: row.bookmark_count ?? 0,
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
  const rawContentJson = parseContentJson(input.content_json);
  assertNoPendingImageSources(rawContentJson);
  const contentJson = normalizePostImageSources(rawContentJson);
  const parsed = postInsertSchema.parse({ ...input, content_json: contentJson });
  const mentionTargetIds = collectMentionTargetIds(parsed.content_json);
  await followService.assertMentionTargetsAreFollowed(client, author.uid, mentionTargetIds);
  const contentHtml = sanitizePostHtmlForStorage(parsed.content_html);
  const contentText = extractPostText(parsed.content_json);
  assertPostContentIsNotEmpty(contentText, contentHtml);

  if (!author.uid) {
    throw new Error("작성자 정보를 확인할 수 없습니다.");
  }

  const payload: PostInsertDB = {
    ...(parsed.id ? { id: parsed.id } : {}),
    title: parsed.title,
    category: parsed.category,
    content_json: parsed.content_json,
    content_html: contentHtml,
    content_text: contentText,
    writer_uid: author.uid,
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
  if (contentJson !== undefined) assertNoPendingImageSources(contentJson);
  const storedContentJson =
    contentJson === undefined ? undefined : normalizePostImageSources(contentJson);
  const parsed = postUpdateSchema.parse({
    ...input,
    ...(storedContentJson === undefined ? {} : { content_json: storedContentJson }),
  });
  const payload: PostUpdateDB = { ...parsed };

  if (storedContentJson !== undefined) {
    const mentionTargetIds = collectMentionTargetIds(storedContentJson);
    await followService.assertMentionTargetsAreFollowed(client, writerUid, mentionTargetIds);
    // 스키마가 JSON과 HTML을 함께 받도록 강제한다.
    const contentHtml = sanitizePostHtmlForStorage(parsed.content_html ?? "");
    const contentText = extractPostText(storedContentJson);
    assertPostContentIsNotEmpty(contentText, contentHtml);
    payload.content_html = contentHtml;
    payload.content_text = contentText;
  }

  const row = await repository.updatePostRecordByOwner(client, id, writerUid, payload);
  if (!row) return null;

  const post = mapRowToPost(row);
  if (storedContentJson !== undefined && row.writer_uid) {
    // 본문 HTML은 브라우저가 만들어 보내므로, HTML에만 있는 이미지도 사용 중으로 남긴다.
    await safePruneContentImages("posts", row.writer_uid, row.id, [
      storedContentJson,
      [...managedPathsFromHtml(row.content_html)],
    ]);
  }
  return post;
}

async function listEngagedPosts(
  client: SupabaseClient<Database>,
  relation: "post_bookmarks" | "post_likes",
  userId: string,
  options?: PostListOptions
): Promise<PostListResult> {
  const parsed = postListOptionsSchema.parse(options ?? {});
  const limit = resolveLimit(parsed.limit, DEFAULT_LIMIT, MAX_LIMIT);
  const offset = resolveOffset(parsed.page, limit);
  const { items: rows, total: rawTotal } = await repository.fetchPostsByEngagement(
    client,
    relation,
    userId,
    {
      limit,
      offset,
      sort: parsed.sort,
      search: parsed.search,
      searchField: parsed.searchField,
    }
  );
  const items = rows.map(mapRowToPost);
  const total = Math.max(rawTotal, offset + items.length);

  return {
    items,
    total,
    limit,
    hasMore: offset + items.length < total,
    offset,
  };
}

/** 로그인 사용자가 북마크한 게시글 목록을 반환한다. */
export function listBookmarkedPosts(
  client: SupabaseClient<Database>,
  userId: string,
  options?: PostListOptions
): Promise<PostListResult> {
  return listEngagedPosts(client, "post_bookmarks", userId, options);
}

/** 로그인 사용자가 좋아요한 게시글 목록을 반환한다. */
export function listLikedPosts(
  client: SupabaseClient<Database>,
  userId: string,
  options?: PostListOptions
): Promise<PostListResult> {
  return listEngagedPosts(client, "post_likes", userId, options);
}

function parseContentJson(contentJson: PostCreateInput["content_json"]) {
  const serialized = typeof contentJson === "string" ? contentJson : JSON.stringify(contentJson);

  if (!serialized.trim()) {
    throw new Error("내용을 입력해 주세요.");
  }
  if (serialized.length > POST_CONTENT_MAX_CHARS) {
    throw new Error(POST_CONTENT_TOO_LARGE_MESSAGE);
  }

  if (typeof contentJson !== "string") return contentJson;

  try {
    return JSON.parse(contentJson);
  } catch {
    throw new Error("유효하지 않은 게시글 형식입니다.");
  }
}

function assertPostContentIsNotEmpty(contentText: string, contentHtml: string): void {
  // 본문 글자는 에디터처럼 공백·빈 줄도 그대로 담으므로, 공백뿐인 글은 비었다고 본다.
  if (!contentText.trim() && !RICH_CONTENT_PATTERN.test(contentHtml)) {
    throw new Error("내용을 입력해 주세요.");
  }
}

/** 게시글 이미지 노드의 이전 공개 URL을 DB 저장용 상대 경로로 바꾼다. */
function normalizePostImageSources(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalizePostImageSources);
  if (!value || typeof value !== "object") return value;

  const node = value as Record<string, unknown>;
  const normalized = Object.fromEntries(
    Object.entries(node).map(([key, child]) => [key, normalizePostImageSources(child)])
  );
  if (node.type === "image" && typeof node.src === "string") {
    normalized.src = normalizeStoredImageReference(node.src) ?? node.src;
  }
  return normalized;
}

function assertNoPendingImageSources(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) assertNoPendingImageSources(item);
    return;
  }
  if (!value || typeof value !== "object") return;

  const node = value as Record<string, unknown>;
  if (node.type === "image" && typeof node.src === "string" && node.src.startsWith("blob:")) {
    throw new Error("이미지 업로드가 완료되지 않았습니다.");
  }
  for (const item of Object.values(node)) assertNoPendingImageSources(item);
}

export async function removePost(client: SupabaseClient<Database>, id: string): Promise<boolean> {
  // 작성자/관리자 판정은 인증 사용자의 세션을 사용하는 RLS가 최종적으로 수행한다.
  const existing = await repository.selectPostById(client, id);
  if (!existing) return false;

  const deleted = await repository.deletePostRecord(client, id);
  if (deleted && existing.writer_uid) {
    await safeRemoveContentImages("posts", existing.writer_uid, existing.id);
  }
  return deleted;
}
