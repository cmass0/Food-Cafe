"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, createEditor, type SerializedEditorState } from "lexical";
import { useFormState, useFormStatus } from "react-dom";

import { Editor } from "@/components/blocks/editor-x/editor";
import { nodes } from "@/components/blocks/editor-x/nodes";
import { editorTheme } from "@/components/editor/themes/editor-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PostActionState } from "@/app/posts/actions";

type PostFormAction = (state: PostActionState, formData: FormData) => Promise<PostActionState>;

type PostFormProps = {
  action: PostFormAction;
  defaultValues?: {
    id?: string;
    title?: string;
    content?: string;
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
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentHtml, setContentHtml] = useState<string>(defaultValues?.content ?? "");
  const [serializedState, setSerializedState] = useState<SerializedEditorState | undefined>(
    undefined
  );

  // Dedicated editor instance for converting between HTML and serialized Lexical state
  const conversionEditor = useMemo(
    () =>
      createEditor({
        namespace: "post-form-converter",
        theme: editorTheme,
        nodes,
      }),
    []
  );

  const htmlToSerialized = useCallback(
    (html?: string | null): SerializedEditorState | undefined => {
      if (!html || !html.trim()) return undefined;
      try {
        const dom = new DOMParser().parseFromString(html, "text/html");
        conversionEditor.update(() => {
          const nodesFromDom = $generateNodesFromDOM(conversionEditor, dom);
          const root = $getRoot();
          root.clear();
          nodesFromDom.forEach((node) => root.append(node));
        });
        return conversionEditor.getEditorState().toJSON();
      } catch (error) {
        console.error("[post-form] failed to parse HTML into editor state", error);
        return undefined;
      }
    },
    [conversionEditor]
  );

  const serializedToHtml = useCallback(
    (state?: SerializedEditorState): string => {
      if (!state) return "";
      try {
        const parsed = conversionEditor.parseEditorState(state);
        conversionEditor.setEditorState(parsed);
        let html = "";
        conversionEditor.update(() => {
          html = $generateHtmlFromNodes(conversionEditor);
        });
        return html;
      } catch (error) {
        console.error("[post-form] failed to serialize editor state to HTML", error);
        return "";
      }
    },
    [conversionEditor]
  );

  useEffect(() => {
    setSerializedState(htmlToSerialized(defaultValues?.content));
    setContentHtml(defaultValues?.content ?? "");
  }, [defaultValues?.content, htmlToSerialized]);

  const handleEditorChange = useCallback(
    (next: SerializedEditorState) => {
      setSerializedState(next);
      const html = serializedToHtml(next);
      setContentHtml(html);
      if (contentError && html.trim()) {
        setContentError(null);
      }
    },
    [contentError, serializedToHtml]
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    if (!contentHtml.trim()) {
      event.preventDefault();
      setContentError("내용을 입력해 주세요.");
      return;
    }
    setContentError(null);
  };

  return (
    <form className="flex flex-col gap-6" action={formAction} onSubmit={handleSubmit}>
      {defaultValues?.id ? <input type="hidden" name="id" defaultValue={defaultValues.id} /> : null}

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
        <Editor editorSerializedState={serializedState} onSerializedChange={handleEditorChange} />
        <input type="hidden" name="content" value={contentHtml} required />
        {contentError ? <p className="text-sm text-destructive">{contentError}</p> : null}
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
        <p className="text-xs text-muted-foreground">게시글 유형을 간단히 표시하세요. (예: board)</p>
      </div>

      {!state.ok && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {cancelHref ? (
          <Link className="rounded border border-input px-3 py-2 text-sm" href={cancelHref}>
            취소
          </Link>
        ) : null}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}

type SubmitButtonProps = {
  label: string;
};

function SubmitButton({ label }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "처리 중..." : label}
    </Button>
  );
}
