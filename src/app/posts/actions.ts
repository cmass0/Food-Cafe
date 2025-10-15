"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getServerSupabase } from "@/lib/supabase/server";
import { postInsertSchema, postUpdateSchema } from "@/features/post/schema";
import * as postService from "@/features/post/service";

function formDataToObject(formData: FormData): Record<string, string> {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export async function createPostAction(formData: FormData) {
  const supabase = getServerSupabase();
  const raw = formDataToObject(formData);
  const parsed = postInsertSchema.parse({
    title: raw.title,
    content: raw.content,
    writerName: raw.writerName ?? raw.writer_name ?? "익명",
    type: raw.type || undefined,
  });

  const post = await postService.createPost(supabase, parsed);
  revalidatePath("/posts");
  revalidatePath("/commu");
  redirect(`/posts/${post.id}`);
}

export async function updatePostAction(formData: FormData) {
  const supabase = getServerSupabase();
  const raw = formDataToObject(formData);
  const id = raw.id;
  if (!id) throw new Error("게시글 ID가 필요합니다.");

  const parsed = postUpdateSchema.parse({
    title: raw.title ?? undefined,
    content: raw.content ?? undefined,
    writerName: raw.writerName ?? raw.writer_name ?? undefined,
    type: raw.type ?? undefined,
  });

  const post = await postService.updatePost(supabase, id, parsed);
  if (!post) throw new Error("게시글을 찾을 수 없습니다.");
  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  revalidatePath("/commu");
  redirect(`/posts/${id}`);
}

export async function deletePostAction(formData: FormData) {
  const supabase = getServerSupabase();
  const raw = formDataToObject(formData);
  const id = raw.id;
  if (!id) throw new Error("게시글 ID가 필요합니다.");
  await postService.removePost(supabase, id);
  revalidatePath("/posts");
  revalidatePath("/commu");
  redirect("/posts");
}
