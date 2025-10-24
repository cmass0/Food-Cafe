"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerSupabase } from "@/lib/supabase/server";
import { postInsertSchema, postUpdateSchema } from "@/features/post/schema";
import * as postService from "@/features/post/service";
import { deriveDisplayName } from "@/features/user/lib/displayName";

export type PostActionState = {
  ok: boolean;
  message?: string;
};

const DEFAULT_ERROR = "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";

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
  const content = (formData.get("content") as string | null)?.trim() ?? "";
  const typeRaw = (formData.get("type") as string | null)?.trim() ?? "";
  const writerName = deriveDisplayName(user) ?? user.email ?? "user";

  const payload = {
    title,
    content,
    writerName,
    type: typeRaw || undefined,
  };

  const parsed = postInsertSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: "입력값을 확인해 주세요." };
  }

  try {
    const post = await postService.createPost(supabase, parsed.data);
    revalidatePath("/posts");
    redirect(`/posts/${post.id}`);
  } catch (err) {
    console.error("[posts] create failed", err);
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
  // users API를 통해 최신 display_name 조회
  try {
    const res = await fetch(`/api/users/${post.writerUid}`, { cache: 'no-store' });
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

  const parsed = postUpdateSchema.safeParse({
    title: (formData.get("title") as string | null)?.trim() || undefined,
    content: (formData.get("content") as string | null)?.trim() || undefined,
    type: (formData.get("type") as string | null)?.trim() || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: "수정할 내용을 올바르게 입력해 주세요." };
  }

  try {
    const writerName = await deriveAuthorDisplayNameByPostId(supabase, id);   
     const payload = { ...parsed.data, writerName };
     const post = await postService.updatePost(supabase, id, payload);
    if (!post) {
      return { ok: false, message: "게시글을 찾을 수 없습니다." };
    }
  } catch (err) {
    console.error("[posts] update failed", err);
    return { ok: false, message: DEFAULT_ERROR };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

export async function deletePostAction(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const supabase = getServerSupabase();
  const id = (formData.get("id") as string | null)?.trim();
  if (!id) {
    return { ok: false, message: "게시글 ID가 필요합니다." };
  }

  try {
    await postService.removePost(supabase, id);
  } catch (err) {
    console.error("[posts] delete failed", err);
    return { ok: false, message: DEFAULT_ERROR };
  }

  revalidatePath("/posts");
  redirect("/posts");
}
