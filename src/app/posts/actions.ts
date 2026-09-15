"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { POST_USER_FACING_ERRORS } from "@/domain/post/messages";
import { postCategorySchema } from "@/domain/post/schema";
import * as postService from "@/domain/post/service";
import { derivePublicDisplayName } from "@/domain/user/lib/displayName";
import { DEFAULT_ACTION_ERROR, toActionErrorMessage } from "@/lib/api/action-error";
import { uploadedPathsFromFormData } from "@/lib/api/form-data";
import { getServerSupabase } from "@/lib/supabase/server";
import { storagePrefix } from "@/lib/storage/paths";
import { safeDiscardFailedUploads } from "@/lib/storage/server";

export type PostActionState = {
  ok: boolean;
  message?: string;
  id?: string;
};

export async function createPostAction(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const supabase = await getServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, message: "로그인이 필요합니다." };
  }

  const idResult = z.string().uuid().safeParse(formData.get("id"));
  const postId = idResult.success ? idResult.data : crypto.randomUUID();
  const uploadedPaths = uploadedPathsFromFormData(formData);
  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const rawJson = formData.get("content_json");
  const category = (formData.get("category") as string | null)?.trim() ?? "";
  const writerName = derivePublicDisplayName(user) ?? "user";

  try {
    if (typeof rawJson !== "string") {
      throw new Error("유효하지 않은 게시글 형식입니다.");
    }

    await postService.createPost(
      supabase,
      {
        id: postId,
        title,
        content_json: rawJson,
        category: postCategorySchema.parse(category),
      },
      {
        uid: user.id,
        name: writerName,
      }
    );
  } catch (err) {
    await safeDiscardFailedUploads(user.id, storagePrefix("posts", user.id, postId), uploadedPaths);
    console.error("게시글 생성 실패", err);
    return { ok: false, message: toActionErrorMessage(err, POST_USER_FACING_ERRORS) };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${postId}`);
  return { ok: true, id: postId };
}

export async function updatePostAction(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const supabase = await getServerSupabase();
  const idResult = z.string().uuid().safeParse(formData.get("id"));
  if (!idResult.success) {
    return { ok: false, message: "게시글 ID가 필요합니다." };
  }
  const id = idResult.data;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, message: "로그인이 필요합니다." };
  }

  const uploadedPaths = uploadedPathsFromFormData(formData);
  const rawJson = formData.get("content_json");
  const title = (formData.get("title") as string | null)?.trim() || undefined;
  const category = (formData.get("category") as string | null)?.trim() ?? "";
  let persisted = false;

  try {
    if (typeof rawJson !== "string") {
      throw new Error("유효하지 않은 게시글 형식입니다.");
    }

    const post = await postService.updatePost(supabase, id, user.id, {
      title,
      content_json: rawJson,
      category: postCategorySchema.parse(category),
    });

    if (!post) {
      await safeDiscardFailedUploads(user.id, storagePrefix("posts", user.id, id), uploadedPaths);
      return { ok: false, message: "게시글을 찾을 수 없습니다." };
    }
    persisted = true;
  } catch (err) {
    if (!persisted) {
      await safeDiscardFailedUploads(user.id, storagePrefix("posts", user.id, id), uploadedPaths);
    }
    console.error("게시글 수정 실패", err);
    return { ok: false, message: toActionErrorMessage(err, POST_USER_FACING_ERRORS) };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  return { ok: true, id };
}

export async function deletePostAction(id: string): Promise<PostActionState> {
  const supabase = await getServerSupabase();

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
    const deleted = await postService.removePost(supabase, id);
    if (!deleted) {
      return { ok: false, message: "삭제할 수 있는 게시글을 찾지 못했습니다." };
    }
  } catch (err) {
    console.error("게시글 삭제 실패", err);
    return { ok: false, message: DEFAULT_ACTION_ERROR };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  redirect("/posts");
}
