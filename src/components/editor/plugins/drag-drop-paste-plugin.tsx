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
import { useEffect, useRef } from "react";

import { useAuth } from "@/app/auth/auth-context";
import { INSERT_IMAGE_COMMAND } from "@/components/editor/plugins/images-plugin";
import { randomKey, uploadBucketImage } from "@/lib/storage";

const ACCEPTABLE_IMAGE_TYPES = ["image/", "image/heic", "image/heif", "image/gif", "image/webp"];

// 드래그 드롭 시 이미지 삽입 처리
// supabase의 storage에 임시 경로 로직 구현 및 취소 or 업로드 확정 시 정식 경로 이동 로직 필요
export function DragDropPastePlugin(): null {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const draftIdRef = useRef(randomKey("draft"));
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      DRAG_DROP_PASTE,
      (files) => {
        (async () => {
          if (!userId) return;
          const filesResult = await mediaFileReader(
            files,
            [ACCEPTABLE_IMAGE_TYPES].flatMap((x) => x)
          );
          for (const { file } of filesResult) {
            if (isMimeType(file, ACCEPTABLE_IMAGE_TYPES)) {
              try {
                const { publicUrl } = await uploadBucketImage(
                  "posts-temp",
                  userId,
                  draftIdRef.current,
                  file,
                  { contentType: file.type }
                );
                if (publicUrl) {
                  editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                    altText: file.name,
                    src: publicUrl,
                  });
                }
              } catch (error) {
                console.error("이미지 업로드 실패", error);
              }
            }
          }
        })();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, userId]);
  return null;
}
