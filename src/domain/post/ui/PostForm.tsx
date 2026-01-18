"use client";

import { $getRoot, EditorState, type SerializedEditorState } from "lexical";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import type { PostActionState } from "@/app/posts/actions";
import { Editor } from "@/components/blocks/editor-x/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthModal } from "@/domain/auth/ui/AuthModalProvider";
import ComfirmModal from "@/lib/ui/comfirmmodal";
import { Json } from "@/types/supabase";

type PostFormAction = (state: PostActionState, formData: FormData) => Promise<PostActionState>;

type PostFormProps = {
  action: PostFormAction;
  defaultValues?: {
    id?: string;
    title?: string;
    contentJson?: Json;
    type?: string;
  };
  submitLabel?: string;
  cancelHref?: string;
};

const initialState: PostActionState = { ok: true };

export default function PostForm({
  action,
  defaultValues,
  submitLabel = "등록",
  cancelHref,
}: PostFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const [contentText, setContentText] = useState<string>("");
  const [serializedState, setSerializedState] = useState<SerializedEditorState | undefined>(
    defaultValues?.contentJson as SerializedEditorState | undefined
  );
  const { pending } = useFormStatus();
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const { openAuthModal } = useAuthModal();
  const router = useRouter();

  useEffect(() => {
    if (!state.ok && state.message) {
      if (state.message === "로그인이 필요합니다.") {
        openAuthModal();
        return;
      }
      setErrorModalMessage(state.message);
      setErrorModalOpen(true);
    }
  }, [openAuthModal, state]);

  // Editor 관련 핸들러
  const handleSerializedChange = (editorState: SerializedEditorState) => {
    setSerializedState(editorState);
  };

  // 게시글 본문에서 사용자 입력 텍스트만 추출
  const handleEditorStateChange = (state: EditorState) => {
    let text = "";
    state.read(() => {
      text = $getRoot().getTextContent();
    });
    setContentText(text.trim());
  };

  const handleCancelConfirm = () => {
    setCancelModalOpen(false);
    router.push(cancelHref ?? "/posts");
  };

  return (
    <>
      <ComfirmModal
        showTrigger={false}
        open={errorModalOpen}
        onOpenChange={setErrorModalOpen}
        btnText=""
        comfirmText={
          <div className="flex items-center gap-2">
            <TriangleAlert className="text-[#f55151]" />
            오류가 발생했습니다
          </div>
        }
        content={errorModalMessage}
        comfirmtype="확인"
        cancelText="닫기"
        oncomfirm={() => setErrorModalOpen(false)}
      />
      <ComfirmModal
        showTrigger={false}
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        btnText=""
        comfirmText="게시글 작성을 취소하시겠습니까?"
        content="작성 중인 내용은 저장되지 않습니다."
        comfirmtype="확인"
        cancelText="닫기"
        oncomfirm={handleCancelConfirm}
      />
      <form className="flex flex-col gap-6" action={formAction}>
        {defaultValues?.id ? (
          <input type="hidden" name="id" defaultValue={defaultValues.id} />
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-semibold">
            제목
          </Label>
          <Input
            id="title"
            name="title"
            type="text"
            defaultValue={defaultValues?.title ?? ""}
            required
            maxLength={150}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-semibold">내용</Label>
          <Editor
            editorSerializedState={serializedState}
            onChange={handleEditorStateChange}
            onSerializedChange={handleSerializedChange}
          />
          <input type="hidden" name="content_text" value={contentText} required />
          <input
            type="hidden"
            name="content_json"
            value={serializedState ? JSON.stringify(serializedState) : ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="text-sm font-semibold">
            타입
          </Label>
          <Input
            id="type"
            name="type"
            type="text"
            defaultValue={defaultValues?.type ?? "board"}
            maxLength={40}
          />
          <p className="text-xs text-muted-foreground">
            게시글 유형을 간단히 표시하세요. (예: board)
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "처리 중..." : "제출"}
            </Button>
            <Button
              type="button"
              className="bg-red-400 hover:bg-red-600"
              onClick={() => setCancelModalOpen(true)}
            >
              취소
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}
