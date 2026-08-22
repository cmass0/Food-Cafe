"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import * as postService from "@/domain/post/service";
import { postCategorySchema } from "@/domain/post/schema";
import { deriveDisplayName } from "@/domain/user/lib/displayName";
import { getServerSupabase } from "@/lib/supabase/server";
import { Database } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { ZodError } from "zod";

export type PostActionState = {
  ok: boolean;
  message?: string;
};

const DEFAULT_ERROR = "요청 처리 과정에서 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
const IMAGE_BUCKET = "Food-Cafe";
const PUBLIC_PREFIX = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${IMAGE_BUCKET}/`;
const TEMP_PREFIX = `${PUBLIC_PREFIX}posts-temp/`;
const USER_FACING_ERRORS = new Set([
  "내용을 입력해 주세요.",
  "본문은 200KB 이하로 작성해 주세요.",
  "유효하지 않은 게시글 형식입니다.",
  "유효하지 않은 형식입니다.",
  "작성자 정보를 확인할 수 없습니다.",
]);

function getActionErrorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "입력 내용을 확인해 주세요.";
  }
  if (error instanceof Error && USER_FACING_ERRORS.has(error.message)) {
    return error.message;
  }
  return DEFAULT_ERROR;
}

// lexical 에디터의 contentJson 내 임시 이미지 경로를 영구 경로로 변경하는 함수
// lexical이 dom같은 트리구조이므로 이미지 노드가 포함된 모든 노드를 재귀적으로 탐색
async function replaceTempImageSrcs(
  supabase: SupabaseClient<Database>,
  node: unknown,
  userId: string,
  postId: string
): Promise<boolean> {
  if (!node || !PUBLIC_PREFIX) return false;

  let changed = false;

  // 배열인 경우 재귀 호출
  if (Array.isArray(node)) {
    for (const item of node) {
      if (await replaceTempImageSrcs(supabase, item, userId, postId)) {
        changed = true;
      }
    }
    return changed;
  }

  if (typeof node !== "object") return false;
  const obj = node as Record<string, unknown>;

  // 이미지 객체인지 확인 및 임시 경로인지 확인
  if (obj.type === "image" && typeof obj.src === "string") {
    const isTemp = obj.src.startsWith(TEMP_PREFIX);
    const isFinal = obj.src.startsWith(`${PUBLIC_PREFIX}posts/`);

    if (isTemp) {
      // 임시 경로인 경우 영구 경로로 이동 처리 후 임시 경로 삭제
      const fromPath = obj.src.slice(PUBLIC_PREFIX.length);
      const filename = fromPath.split("/").slice(3).join("/");

      if (filename) {
        const toPath = `posts/${userId}/${postId}/${filename}`;
        try {
          const { error: copyError } = await supabase.storage
            .from(IMAGE_BUCKET)
            .copy(fromPath, toPath);
          if (copyError) console.error("copy error: ", copyError);

          const { error: removeError } = await supabase.storage
            .from(IMAGE_BUCKET)
            .remove([fromPath]);
          if (removeError) console.error("remove error: ", removeError);
          obj.src = `${PUBLIC_PREFIX}${toPath}`;
          changed = true;
        } catch (error) {
          console.error("게시글 이미지 이동 실패", error);
        }
      }
    }

    if (!isTemp && !isFinal) {
      throw new Error();
    }
  }
  // 객체면 위쪽 이미지 경로 처리 후 재귀호출
  for (const value of Object.values(obj)) {
    if (await replaceTempImageSrcs(supabase, value, userId, postId)) {
      changed = true;
    }
  }
  return changed;
}

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

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const rawJson = formData.get("content_json");
  // 의도치 않은 값 삽입 방지
  if (typeof rawJson !== "string") {
    return { ok: false, message: "유효하지 않은 게시글 내용입니다." };
  }
  const category = (formData.get("category") as string | null)?.trim() ?? "";
  const writerName = deriveDisplayName(user) ?? user.email ?? "user";

  let postId: string;
  try {
    const payload = {
      title,
      content_json: rawJson,
      category: postCategorySchema.parse(category),
    };
    const post = await postService.createPost(supabase, payload, {
      uid: user.id,
      name: writerName,
    });
    if (post.contentJson) {
      const contentJsonObj =
        typeof post.contentJson === "string" ? JSON.parse(post.contentJson) : post.contentJson;

      const changed = await replaceTempImageSrcs(supabase, contentJsonObj, user.id, post.id);
      if (changed) {
        await postService.updatePost(supabase, post.id, user.id, {
          content_json: JSON.stringify(contentJsonObj),
        });
      }
    }
    postId = post.id;
  } catch (err) {
    console.error("게시글 생성 실패", err);
    return { ok: false, message: getActionErrorMessage(err) };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${postId}`);
  redirect(`/posts/${postId}`);
}

export async function updatePostAction(
  _prevState: PostActionState,
  formData: FormData
): Promise<PostActionState> {
  const supabase = await getServerSupabase();
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
  // 의도치 않은 값 삽입 방지
  if (typeof rawJson !== "string") {
    return { ok: false, message: "유효하지 않은 게시글 내용입니다." };
  }
  const title = (formData.get("title") as string | null)?.trim() || undefined;
  const category = (formData.get("category") as string | null)?.trim() ?? "";

  try {
    const payload = {
      title,
      content_json: rawJson,
      category: postCategorySchema.parse(category),
    };
    const post = await postService.updatePost(supabase, id, user.id, payload);

    if (!post) {
      return { ok: false, message: "게시글을 찾을 수 없습니다." };
    }
  } catch (err) {
    console.error("게시글 수정 실패", err);
    return { ok: false, message: getActionErrorMessage(err) };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
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
    return { ok: false, message: DEFAULT_ERROR };
  }

  revalidatePath("/posts");
  revalidatePath(`/posts/${id}`);
  redirect("/posts");
}
