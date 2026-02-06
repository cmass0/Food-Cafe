import "server-only";

import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes } from "@lexical/html";
import type { SerializedEditorState } from "lexical";

import sanitizeHtml from "sanitize-html";

import { nodesServer } from "@/components/blocks/editor-x/nodes.server";
import { ensureDom } from "@/lib/dom-shim";

// SerializedEditorState 타입 가드
function isSerializedEditorState(value: unknown): value is SerializedEditorState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const root = (value as { root?: unknown }).root;
  return !!root && typeof root === "object" && "children" in root;
}

// Lexical의 SerializedEditorState를 HTML 문자열로 변환
function lexicalJsonToHtml(serialized: SerializedEditorState): string {
  ensureDom();
  const editor = createHeadlessEditor({
    nodes: nodesServer,
    onError: (err) => {
      throw err;
    },
  });
  const state = editor.parseEditorState(JSON.stringify(serialized));
  editor.setEditorState(state);

  let html = "";
  editor.getEditorState().read(() => {
    html = $generateHtmlFromNodes(editor, null);
  });
  return html;
}

// sanitize-html을 사용하여 허용된 태그 및 속성만 남기고 나머지는 제거
function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "img", "div", "iframe"],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      div: ["data-embed", "data-id"],
      iframe: ["src", "width", "height", "allow", "allowfullscreen", "title", "class"],
    },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: { img: ["https"], iframe: ["https"] },
    transformTags: {
      a: (tagName, attribs) => {
        const rel = typeof attribs.rel === "string" ? attribs.rel.split(/\s+/) : [];
        if (!rel.includes("noopener")) rel.push("noopener");
        return {
          tagName,
          attribs: {
            ...attribs,
            rel: rel.join(" ").trim(),
          },
        };
      },
    },
  });
}

export function buildPostContentHtml(contentJson: unknown): string {
  if (!isSerializedEditorState(contentJson)) {
    throw new Error("유효하지 않은 형식입니다.");
  }

  return sanitizePostHtml(lexicalJsonToHtml(contentJson));
}
