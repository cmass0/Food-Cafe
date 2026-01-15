"use client";

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { DRAG_DROP_PASTE } from "@lexical/rich-text";
import { isMimeType, mediaFileReader } from "@lexical/utils";
import { COMMAND_PRIORITY_LOW } from "lexical";
import { useEffect } from "react";

import { INSERT_IMAGE_COMMAND } from "@/components/editor/plugins/images-plugin";

const ACCEPTABLE_IMAGE_TYPES = ["image/", "image/heic", "image/heif", "image/gif", "image/webp"];

// 드래그 드롭 시 이미지 삽입 처리
// supabase의 storage에 임시 경로 로직 구현 및 취소 or 업로드 확정 시 정식 경로 이동 로직 필요
export function DragDropPastePlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
          );
          for (const { file, result } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText: file.name,
                src: result,
              });
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor]);
  return null;
}
