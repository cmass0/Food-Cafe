"use client";

import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes } from "@lexical/html";
import type { SerializedEditorState } from "lexical";
import sanitizeHtml from "sanitize-html";

import { nodes } from "@/components/blocks/editor-x/nodes";

function isSerializedEditorState(value: unknown): value is SerializedEditorState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const root = (value as { root?: unknown }).root;
  return !!root && typeof root === "object" && "children" in root;
}

// https://lexical.dev/docs/concepts/serialization 공식 문서 lexcical -> html  참고
function lexicalJsonToHtml(serialized: SerializedEditorState): string {
  const editor = createHeadlessEditor({
    nodes,
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

// https://www.npmjs.com/package/sanitize-html 문서 참고
function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "img"],
    allowedAttributes: { a: ["href", "target", "rel"], img: ["src", "alt"] },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: { img: ["https"] },
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

export default function PostContentHtml({ contentJson }: { contentJson: unknown }) {
  const contentHtml = isSerializedEditorState(contentJson)
    ? sanitizePostHtml(lexicalJsonToHtml(contentJson))
    : "";

  return <section className="prose max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />;
}
