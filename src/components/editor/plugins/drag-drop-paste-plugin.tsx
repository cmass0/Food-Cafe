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

import { usePendingImageRegistration } from "@/components/editor/context/pending-image-context";
import { INSERT_IMAGE_COMMAND } from "@/components/editor/plugins/images-plugin";

const ACCEPTABLE_IMAGE_TYPES = ["image/", "image/heic", "image/heif", "image/gif", "image/webp"];

// 드래그·붙여넣기 파일도 object URL로만 미리 보고 게시글 제출 시 한 번에 업로드한다.
export function DragDropPastePlugin(): null {
  const registerPendingImage = usePendingImageRegistration();
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          if (!registerPendingImage) return;
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
          );
          for (const { file } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                altText: file.name,
                src: registerPendingImage(file),
              });
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, registerPendingImage]);
  return null;
}
