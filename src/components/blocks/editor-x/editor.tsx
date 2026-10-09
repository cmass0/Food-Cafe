"use client";

import { InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { EditorState, SerializedEditorState } from "lexical";

import { editorTheme } from "@/components/editor/themes/editor-theme";
import { PendingImageProvider } from "@/components/editor/context/pending-image-context";
import { TooltipProvider } from "@/components/ui/tooltip";

import { nodes } from "./nodes";
import { Plugins } from "./plugins";

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error);
  },
};

export function Editor({
  maxLength,
  editorState,
  editorSerializedState,
  onChange,
  onSerializedChange,
  onImageFileSelect,
}: {
  /** 본문 글자 수 상한. 이보다 길게 입력하면 넘친 글자를 지운다. */
  maxLength: number;
  editorState?: EditorState;
  editorSerializedState?: SerializedEditorState;
  onChange?: (editorState: EditorState) => void;
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void;
  onImageFileSelect?: (file: File) => string;
}) {
  return (
    <div className="bg-background overflow-hidden rounded-lg border shadow">
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(editorState ? { editorState } : {}),
          ...(editorSerializedState ? { editorState: JSON.stringify(editorSerializedState) } : {}),
        }}
      >
        <PendingImageProvider register={onImageFileSelect}>
          <TooltipProvider>
            <Plugins maxLength={maxLength} />

            <OnChangePlugin
              ignoreSelectionChange={true}
              onChange={(editorState) => {
                onChange?.(editorState);
                onSerializedChange?.(editorState.toJSON());
              }}
            />
          </TooltipProvider>
        </PendingImageProvider>
      </LexicalComposer>
    </div>
  );
}
