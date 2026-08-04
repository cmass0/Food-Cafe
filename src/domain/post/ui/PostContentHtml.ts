import "server-only";

import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $getRoot, type SerializedEditorState } from "lexical";

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
const YOUTUBE_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

function getYouTubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
    } else if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      if (url.pathname === "/watch") {
        videoId = url.searchParams.get("v");
      } else {
        const [kind, id] = url.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live", "v"].includes(kind ?? "")) {
          videoId = id ?? null;
        }
      }
    }

    return videoId && YOUTUBE_VIDEO_ID.test(videoId) ? videoId : null;
  } catch {
    return null;
  }
}

function createYouTubeLinkCard(videoId: string, href: string): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "youtube-link-card";
  card.setAttribute("data-youtube-video-id", videoId);

  const link = document.createElement("a");
  link.className = "youtube-link-card__link";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const thumbnail = document.createElement("div");
  thumbnail.className = "youtube-link-card__thumbnail";
  const image = document.createElement("img");
  image.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  image.alt = "YouTube 동영상 썸네일";
  thumbnail.append(image);

  const description = document.createElement("div");
  description.className = "youtube-link-card__description";
  const title = document.createElement("strong");
  title.textContent = "YouTube 동영상";
  const source = document.createElement("div");
  source.textContent = "youtube.com에서 보기";
  description.append(title, source);

  link.append(thumbnail, description);
  card.append(link);
  return card;
}

/** Promote a standalone pasted YouTube URL to a clickable thumbnail card. */
export function enhanceStandaloneYouTubeLinks(html: string): string {
  ensureDom();
  const container = document.createElement("div");
  container.innerHTML = html;

  for (const paragraph of Array.from(container.querySelectorAll("p"))) {
    const text = paragraph.textContent?.trim() ?? "";
    const children = Array.from(paragraph.children);
    const onlyLink = children.length === 1 && children[0]?.tagName === "A" ? children[0] : null;
    const href = onlyLink?.getAttribute("href") ?? text;

    // Keep inline links as links; only a paragraph containing one URL becomes a card.
    if ((children.length === 0 || onlyLink) && text === href) {
      const videoId = getYouTubeVideoId(href);
      if (videoId) paragraph.replaceWith(createYouTubeLinkCard(videoId, href));
    }
  }

  return container.innerHTML;
}

export function sanitizePostHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "a", "img", "div", "iframe"],
    allowedAttributes: {
      a: ["href", "target", "rel", "class"],
      img: ["src", "alt", "class"],
      div: ["data-embed", "data-id", "data-youtube-video-id", "class"],
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

export function renderPostContentHtml(html: string): string {
  return sanitizePostHtml(enhanceStandaloneYouTubeLinks(html));
}

export function buildPostContentHtml(contentJson: unknown): string {
  if (!isSerializedEditorState(contentJson)) {
    throw new Error("유효하지 않은 형식입니다.");
  }

  return renderPostContentHtml(lexicalJsonToHtml(contentJson));
}

export function buildPostContentText(contentJson: unknown): string {
  if (!isSerializedEditorState(contentJson)) {
    throw new Error("유효하지 않은 형식입니다.");
  }

  ensureDom();
  const editor = createHeadlessEditor({
    nodes: nodesServer,
    onError: (err) => {
      throw err;
    },
  });
  const state = editor.parseEditorState(JSON.stringify(contentJson));
  editor.setEditorState(state);

  let text = "";
  editor.getEditorState().read(() => {
    text = $getRoot().getTextContent().trim();
  });
  return text;
}
