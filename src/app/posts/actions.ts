"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect";
import { redirect } from "next/navigation";

import * as postService from "@/domain/post/service";
import { deriveDisplayName } from "@/domain/user/lib/displayName";
import { getServerSupabase } from "@/lib/supabase/server";

export type PostActionState = {
  ok: boolean;
  message?: string;
};

const DEFAULT_ERROR = "요청 처리 과정에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";

export async function createPostAction(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const supabase = getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, message: "로그인이 필요합니다." };
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const rawJson = formData.get("content_json");
  // 의도치 않은 값 삽입 방지
  if (typeof rawJson !== "string") {
    return { ok: false, message: "유효하지 않은 게시글 내용입니다." };
  }
  const contentText = formData.get("content_text");
  // 의도치 않은 값 삽입 방지
  if (typeof contentText !== "string") {
    return { ok: false, message: "유효하지 않은 게시글 내용입니다." };
  }

  const typeRaw = (formData.get("type") as string | null)?.trim() ?? "";
  const writerName = deriveDisplayName(user) ?? user.email ?? "user";

  const payload = {
    title,
    content_json: rawJson,
    content_text: contentText,
    writer_name: writerName,
    type: typeRaw || undefined,
    writer_uid: user.id,
  };

  try {
    const post = await postService.createPost(supabase, payload, user.id);
    revalidatePath("/posts");
    revalidatePath(`/posts/${post.id}`);
    redirect(`/posts/${post.id}`);
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("게시글 생성 실패", err);
    return { ok: false, message: DEFAULT_ERROR };
  }

  return { ok: true };
}

async function deriveAuthorDisplayNameByPostId(
  client: ReturnType<typeof getServerSupabase>,
  postId: string
): Promise<string> {
  const post = await postService.getPost(client, postId);
  if (!post?.writerUid) return "익명";

  try {
    const res = await fetch(`/api/users/${post.writerUid}`, { cache: "no-store" });
    if (!res.ok) return post.writerName ?? "익명";
    const json = await res.json();
    return json?.data?.display_name ?? post.writerName ?? "익명";
  } catch {
    return post.writerName ?? "익명";
  }
}

export async function updatePostAction(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const supabase = getServerSupabase();
  const id = (formData.get("id") as string | null)?.trim();

  if (!id) {
    return { ok: false, message: "게시글 ID가 필요합니다." };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, message: "로그인이 필요합니다." };
  }

  const rawJson = formData.get("content_json");
  const contentJson = typeof rawJson === "string" ? JSON.parse(rawJson) : undefined;
  const contentText = formData.get("content_text") as unknown;
  const title = (formData.get("title") as string | null)?.trim() || undefined;
  const typeRaw = (formData.get("type") as string | null)?.trim() ?? "";

  try {
    const writerName = await deriveAuthorDisplayNameByPostId(supabase, id);

    const payload = {
      title,
      content_json: contentJson,
      content_text: contentText,
      writer_name: writerName,
      type: typeRaw || undefined,
    };
    const post = await postService.updatePost(supabase, id, user.id, payload);

    if (!post) {
      return { ok: false, message: "게시글을 찾을 수 없습니다." };
    }
  } catch (err) {
    console.error("게시글 수정 실패", err);
    return { ok: false, message: DEFAULT_ERROR };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

export async function deletePostAction(id: string): Promise<PostActionState> {
  const supabase = getServerSupabase();

  if (!id) {
    return { ok: false, message: "게시글 ID가 필요합니다." };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, message: "로그인이 필요합니다." };
  }

  try {
    await postService.removePost(supabase, id, user.id);
  } catch (err) {
    console.error("게시글 삭제 실패", err);
    return { ok: false, message: DEFAULT_ERROR };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  redirect("/posts");
}
