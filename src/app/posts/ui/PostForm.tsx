"use client";

import { $getRoot, type EditorState, type SerializedEditorState } from "lexical";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import type { PostActionState } from "@/app/posts/actions";
import { Editor } from "@/components/blocks/editor-x/editor";
import { FormActionBar, type FormMode } from "@/components/forms/FormActionBar";
import { FormStatusAlert } from "@/components/forms/FormStatusAlert";
import { useFormSuccess } from "@/components/forms/useFormSuccess";
import { useLockedSubmit } from "@/components/forms/useLockedSubmit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { isPostCategory, POST_CATEGORY_OPTIONS, type PostCategory } from "@/domain/post/category";
import {
  collectPendingImageSources,
  replacePendingImageSources,
} from "@/domain/post/pendingImages";
import { removeUploadedBucketImages, uploadBucketImage } from "@/lib/storage";
import type { Json } from "@/types/supabase";

type PostFormAction = (state: PostActionState, formData: FormData) => Promise<PostActionState>;

type PostFormProps = {
  action: PostFormAction;
  defaultValues?: {
    id?: string;
    title?: string;
    contentJson?: Json;
    category?: PostCategory;
  };
  mode: FormMode;
  cancelHref: string;
};

const initialState: PostActionState = { ok: true };
const EMBED_NODE_TYPES = new Set(["image", "youtube", "video", "embed"]);

function hasMeaningfulEditorContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasMeaningfulEditorContent);
  if (!value || typeof value !== "object") return false;

  const node = value as Record<string, unknown>;
  if (typeof node.text === "string" && node.text.trim().length > 0) return true;
  if (typeof node.type === "string" && EMBED_NODE_TYPES.has(node.type)) return true;
  return Object.values(node).some(hasMeaningfulEditorContent);
}

export default function PostForm({ action, defaultValues, mode, cancelHref }: PostFormProps) {
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [category, setCategory] = useState<PostCategory>(defaultValues?.category ?? "free");
  const [contentLength, setContentLength] = useState(0);
  const [serializedState, setSerializedState] = useState<SerializedEditorState | undefined>(
    defaultValues?.contentJson as SerializedEditorState | undefined
  );
  const [clientError, setClientError] = useState("");
  const [validationAttempted, setValidationAttempted] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pendingFilesRef = useRef(new Map<string, File>());
  const previewUrlsRef = useRef(new Set<string>());
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const finish = useFormSuccess();
  const titleError = !title.trim()
    ? "제목을 입력해 주세요."
    : title.trim().length > 150
      ? "제목은 150자 이하로 입력해 주세요."
      : "";
  const contentError = hasMeaningfulEditorContent(serializedState) ? "" : "내용을 입력해 주세요.";

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      for (const previewUrl of previewUrls) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  useEffect(() => {
    if (!state.ok && state.message === "로그인이 필요합니다.") {
      openAuthModal();
    }
  }, [openAuthModal, state]);

  function handleEditorStateChange(editorState: EditorState) {
    editorState.read(() => {
      setContentLength($getRoot().getTextContent().trim().length);
    });
  }

  const registerPendingImage = useCallback((file: File): string => {
    const previewUrl = URL.createObjectURL(file);
    pendingFilesRef.current.set(previewUrl, file);
    previewUrlsRef.current.add(previewUrl);
    return previewUrl;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setClientError("");
    setState(initialState);
    setValidationAttempted(true);

    if (titleError) {
      titleRef.current?.focus();
      return;
    }
    if (!isPostCategory(category)) {
      setClientError("카테고리를 선택해 주세요.");
      return;
    }
    if (!serializedState || contentError) {
      contentRef.current?.querySelector<HTMLElement>('[contenteditable="true"]')?.focus();
      return;
    }
    if (!user) {
      openAuthModal();
      return;
    }

    // 필드를 잠그면 FormData에서 제외되므로, 입력을 잠그기 전에 값을 읽는다.
    const formData = new FormData(form);
    formData.set("title", title.trim());
    const postId = defaultValues?.id ?? crypto.randomUUID();
    const uploadedPaths: string[] = [];
    let actionStarted = false;
    setPending(true);

    try {
      const referencedPreviews = collectPendingImageSources(
        serializedState,
        pendingFilesRef.current
      );
      const uploadResults = await Promise.allSettled(
        [...referencedPreviews].map(async (previewUrl) => {
          const file = pendingFilesRef.current.get(previewUrl);
          if (!file) throw new Error("선택한 이미지 파일을 찾지 못했습니다.");

          const uploaded = await uploadBucketImage("posts", user.id, postId, file, {
            upsert: false,
            contentType: file.type || undefined,
          });
          return { path: uploaded.path, previewUrl };
        })
      );
      const replacements = new Map<string, string>();
      let uploadError: unknown;
      for (const result of uploadResults) {
        if (result.status === "rejected") {
          uploadError ??= result.reason;
          continue;
        }
        uploadedPaths.push(result.value.path);
        replacements.set(result.value.previewUrl, result.value.path);
      }
      if (uploadError) throw uploadError;

      const finalState = replacePendingImageSources(serializedState, replacements);
      formData.set("id", postId);
      formData.set("content_json", JSON.stringify(finalState));
      formData.set("uploaded_paths", JSON.stringify(uploadedPaths));

      actionStarted = true;
      const nextState = await action(state, formData);
      setState(nextState);
      if (nextState.ok && nextState.id) finish(`/posts/${nextState.id}`, mode);
    } catch (error) {
      if (!actionStarted && uploadedPaths.length > 0) {
        try {
          await removeUploadedBucketImages(uploadedPaths);
        } catch (rollbackError) {
          console.error("게시글 이미지 업로드 롤백 실패", rollbackError);
        }
      }
      console.error("게시글 제출 실패", error);
      setClientError(
        actionStarted
          ? "저장 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
          : "이미지 업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      setPending(false);
    }
  }

  const serverError =
    !state.ok && state.message !== "로그인이 필요합니다." ? state.message : undefined;
  const errorMessage =
    validationAttempted && (titleError || contentError)
      ? "입력 내용을 확인해 주세요."
      : clientError || serverError;
  const initialContent = defaultValues?.contentJson as SerializedEditorState | undefined;
  const contentDirty = initialContent
    ? JSON.stringify(serializedState?.root.children) !==
      JSON.stringify(initialContent.root.children)
    : hasMeaningfulEditorContent(serializedState);
  const dirty =
    title !== (defaultValues?.title ?? "") ||
    category !== (defaultValues?.category ?? "free") ||
    contentDirty;
  const submit = useLockedSubmit(handleSubmit);

  return (
    <form className="space-y-5" onSubmit={submit} noValidate aria-busy={pending}>
      {defaultValues?.id ? <input type="hidden" name="id" defaultValue={defaultValues.id} /> : null}
      <input type="hidden" name="category" value={category} />
      <input
        type="hidden"
        name="content_json"
        value={serializedState ? JSON.stringify(serializedState) : ""}
      />

      <fieldset disabled={pending} inert={pending} className="min-w-0">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100">
            <CardTitle className="text-2xl font-semibold">
              {mode === "edit" ? "게시글 수정" : "게시글 작성"}
            </CardTitle>
            <CardDescription>
              카테고리를 선택하고 다른 사용자에게 도움이 되는 이야기를 남겨보세요.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="title" className="font-semibold">
                  제목
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {title.length} / 150
                </span>
              </div>
              <Input
                ref={titleRef}
                id="title"
                aria-invalid={validationAttempted && !!titleError}
                aria-describedby={
                  validationAttempted && titleError ? "post-title-error" : undefined
                }
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="제목을 입력해 주세요."
                required
                maxLength={150}
                className="h-11"
              />
              {validationAttempted && titleError ? (
                <p id="post-title-error" className="text-sm text-destructive">
                  {titleError}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-category" className="font-semibold">
                카테고리
              </Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  if (isPostCategory(value)) setCategory(value);
                }}
              >
                <SelectTrigger id="post-category" className="h-11 w-full sm:w-60">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {POST_CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div
              ref={contentRef}
              className="space-y-2"
              role="group"
              aria-labelledby="post-content-label"
              aria-describedby={
                validationAttempted && contentError ? "post-content-error" : undefined
              }
            >
              <div className="flex items-center justify-between gap-4">
                <Label id="post-content-label" className="font-semibold">
                  내용
                </Label>
                <span className="text-xs tabular-nums text-muted-foreground">
                  텍스트 {contentLength.toLocaleString()}자
                </span>
              </div>
              <Editor
                editorSerializedState={serializedState}
                onChange={handleEditorStateChange}
                onSerializedChange={(editorState) => setSerializedState(editorState)}
                onImageFileSelect={registerPendingImage}
              />
              {validationAttempted && contentError ? (
                <p id="post-content-error" className="text-sm text-destructive">
                  {contentError}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </fieldset>
      <FormStatusAlert message={errorMessage} />
      <FormActionBar
        mode={mode}
        resourceLabel="게시글"
        pending={pending}
        dirty={dirty}
        cancelHref={cancelHref}
      />
    </form>
  );
}
