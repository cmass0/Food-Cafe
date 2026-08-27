"use client";

import { $getRoot, type EditorState, type SerializedEditorState } from "lexical";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/app/auth/auth-context";
import type { PostActionState } from "@/app/posts/actions";
import { Editor } from "@/components/blocks/editor-x/editor";
import { Button } from "@/components/ui/button";
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
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import { isPostCategory, POST_CATEGORY_OPTIONS, type PostCategory } from "@/domain/post/category";
import {
  collectPendingImageSources,
  replacePendingImageSources,
} from "@/domain/post/ui/pendingPostImages";
import { removeUploadedBucketImages, uploadBucketImage } from "@/lib/storage";
import ComfirmModal from "@/lib/ui/comfirmmodal";
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
  submitLabel?: string;
  cancelHref?: string;
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

export default function PostForm({
  action,
  defaultValues,
  submitLabel = "등록",
  cancelHref,
}: PostFormProps) {
  const [state, setState] = useState(initialState);
  const [pending, setPending] = useState(false);
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [category, setCategory] = useState<PostCategory>(defaultValues?.category ?? "free");
  const [contentLength, setContentLength] = useState(0);
  const [serializedState, setSerializedState] = useState<SerializedEditorState | undefined>(
    defaultValues?.contentJson as SerializedEditorState | undefined
  );
  const [clientError, setClientError] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const pendingFilesRef = useRef(new Map<string, File>());
  const previewUrlsRef = useRef(new Set<string>());
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();

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

    if (!isPostCategory(category)) {
      setClientError("카테고리를 선택해 주세요.");
      return;
    }
    if (!serializedState || !hasMeaningfulEditorContent(serializedState)) {
      setClientError("내용을 입력해 주세요.");
      return;
    }
    if (!user) {
      openAuthModal();
      return;
    }

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
      const formData = new FormData(form);
      formData.set("id", postId);
      formData.set("content_json", JSON.stringify(finalState));
      formData.set("uploaded_paths", JSON.stringify(uploadedPaths));

      actionStarted = true;
      const nextState = await action(state, formData);
      setState(nextState);
    } catch (error) {
      if (!actionStarted && uploadedPaths.length > 0) {
        try {
          await removeUploadedBucketImages(uploadedPaths);
        } catch (rollbackError) {
          console.error("게시글 이미지 업로드 롤백 실패", rollbackError);
        }
      }
      console.error("게시글 제출 실패", error);
      setClientError("이미지 업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  function handleCancelConfirm() {
    setCancelModalOpen(false);
    router.push(cancelHref ?? "/posts");
  }

  const serverError =
    !state.ok && state.message !== "로그인이 필요합니다." ? state.message : undefined;
  const errorMessage = clientError || serverError;
  const isEditing = Boolean(defaultValues?.id);

  return (
    <>
      <ComfirmModal
        showTrigger={false}
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        btnText=""
        comfirmText="게시글 작성을 취소하시겠습니까?"
        content="작성 중인 내용은 저장되지 않습니다."
        comfirmtype="확인"
        cancelText="계속 작성"
        oncomfirm={handleCancelConfirm}
      />

      <form className="space-y-5" onSubmit={handleSubmit}>
        {defaultValues?.id ? (
          <input type="hidden" name="id" defaultValue={defaultValues.id} />
        ) : null}
        <input type="hidden" name="category" value={category} />
        <input
          type="hidden"
          name="content_json"
          value={serializedState ? JSON.stringify(serializedState) : ""}
        />

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="border-b border-zinc-100">
            <CardTitle>{isEditing ? "게시글 수정" : "게시글 작성"}</CardTitle>
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
                id="title"
                name="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="제목을 입력해 주세요."
                required
                maxLength={150}
                className="h-11"
              />
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

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label className="font-semibold">내용</Label>
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
            </div>

            {errorMessage ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => setCancelModalOpen(true)}
          >
            취소
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "처리 중..." : submitLabel}
          </Button>
        </div>
      </form>
    </>
  );
}
