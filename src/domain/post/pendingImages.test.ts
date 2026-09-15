import type { SerializedEditorState } from "lexical";
import { describe, expect, test } from "vitest";

import { collectPendingImageSources, replacePendingImageSources } from "./pendingImages";

function pendingFiles(...sources: string[]): ReadonlyMap<string, File> {
  return new Map(sources.map((source) => [source, {} as File]));
}

describe("collectPendingImageSources", () => {
  test("최종 에디터 내용에 남은 pending 이미지만 중복 없이 수집한다", () => {
    const content = {
      root: {
        children: [
          { type: "image", src: "blob:keep" },
          { type: "image", src: "blob:keep" },
          { type: "image", src: "https://cdn.example.com/existing.jpg" },
        ],
      },
    };

    expect([...collectPendingImageSources(content, pendingFiles("blob:keep", "blob:removed"))]).toEqual([
      "blob:keep",
    ]);
  });
});

describe("replacePendingImageSources", () => {
  test("업로드된 이미지 노드의 임시 주소만 Storage 경로로 교체한다", () => {
    const state = {
      root: {
        children: [
          { type: "image", src: "blob:keep" },
          { type: "link", src: "blob:keep" },
          { type: "image", src: "blob:not-uploaded" },
        ],
      },
    } as unknown as SerializedEditorState;

    const result = replacePendingImageSources(
      state,
      new Map([["blob:keep", "posts/user-1/post-1/image.jpg"]])
    ) as unknown as { root: { children: Array<{ src: string }> } };

    expect(result.root.children.map((node) => node.src)).toEqual([
      "posts/user-1/post-1/image.jpg",
      "blob:keep",
      "blob:not-uploaded",
    ]);
  });
});
