"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerSupabase } from "@/lib/supabase/server";
import { postInsertSchema, postUpdateSchema } from "@/features/post/schema";
import * as postService from "@/features/post/service";

export type PostActionState = {
  ok: boolean;
  message?: string;
};

const DEFAULT_ERROR = "요청 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.";

function formDataToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export async function createPostAction(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const supabase = getServerSupabase();
  const raw = formDataToObject(formData);
  const parsed = postInsertSchema.safeParse({
    title: raw.title,
    content: raw.content,
    writerName: raw.writerName ?? raw.writer_name ?? "익명",
    type: raw.type || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "입력값을 확인해 주세요." };
  }

  try {
    const post = await postService.createPost(supabase, parsed.data);
    revalidatePath("/posts");
    redirect(`/posts/${post.id}`);
  } catch (error) {
    console.error("[posts] create failed", error);
    return { ok: false, message: DEFAULT_ERROR };
  }

  return { ok: true };
}

export async function updatePostAction(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const supabase = getServerSupabase();
  const raw = formDataToObject(formData);
  const id = raw.id;
  if (!id) {
    return { ok: false, message: "게시글 ID가 필요합니다." };
  }

  const parsed = postUpdateSchema.safeParse({
    title: raw.title ?? undefined,
    content: raw.content ?? undefined,
    writerName: raw.writerName ?? raw.writer_name ?? undefined,
    type: raw.type ?? undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "수정할 내용을 올바르게 입력해 주세요." };
  }

  try {
    const post = await postService.updatePost(supabase, id, parsed.data);
    if (!post) {
      return { ok: false, message: "게시글을 찾을 수 없습니다." };
    }
  } catch (error) {
    console.error("[posts] update failed", error);
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
  const raw = formDataToObject(formData);
  const id = raw.id;
  if (!id) {
    return { ok: false, message: "게시글 ID가 필요합니다." };
  }

  try {
    await postService.removePost(supabase, id);
  } catch (error) {
    console.error("[posts] delete failed", error);
    return { ok: false, message: DEFAULT_ERROR };
  }

  revalidatePath("/posts");
  redirect("/posts");
}
