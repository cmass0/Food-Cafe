import "server-only";

import type { SerializedEditorState } from "lexical";
import sanitizeHtml from "sanitize-html";

import { managedStoragePathFromValue, resolveStorageImageUrl } from "@/lib/storage/paths";

// 게시글 본문 HTML은 브라우저 에디터가 만들어 보낸다(components/blocks/editor-x/export-html.ts).
// 글쓴이가 Supabase API로 DB에 직접 쓸 수도 있는 값이라 믿지 않고, 저장할 때와 보여 줄 때 모두
// 이 허용 목록으로 정제한다. 허용 목록이 곧 보안 경계이므로 태그·속성·클래스·스타일·주소를 하나씩 좁혀 연다.
// 서버는 DOM을 쓰지 않는다. 문자열 파서(sanitize-html) 한 번으로 정제와 이미지 주소 처리를 함께 한다.

const COLOR =
  /^(?:#[0-9a-f]{3,8}|rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\))$/i;
const TEXT_ALIGN = /^(?:left|right|center|justify|start|end)$/;
const PRE_WRAP = /^pre-wrap$/;
// 2단·3단 레이아웃(에디터 "열 나누기")의 열 비율. 1~4개의 fr 값만 받는다.
const GRID_COLUMNS = /^\d{1,2}fr(?:\s+\d{1,2}fr){0,3}$/;
const DIMENSION = /^\d{1,4}$/;
const YOUTUBE_EMBED = /^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[A-Za-z0-9_-]{11}$/;

const TEXT_STYLES = {
  color: [COLOR],
  "background-color": [COLOR],
  "text-align": [TEXT_ALIGN],
  "white-space": [PRE_WRAP],
};

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

// 우리 Storage 이미지는 DB에 상대 경로로 둔다(공개 주소가 와도 상대 경로로 바꾼다). 외부 이미지는 https만 받는다.
function storedImageSource(src: string | undefined): string | null {
  if (!src) return null;
  const managed = managedStoragePathFromValue(src);
  if (managed) return managed;
  return isHttpsUrl(src.trim()) ? src.trim() : null;
}

// 보여 줄 때는 상대 경로를 현재 Storage 공개 주소로 바꾼다.
function displayedImageSource(src: string | undefined): string | null {
  const stored = storedImageSource(src);
  if (!stored) return null;
  return managedStoragePathFromValue(stored) ? resolveStorageImageUrl(stored) : stored;
}

function sanitize(html: string, resolveImage: (src: string | undefined) => string | null): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "code",
      "sub",
      "sup",
      "span",
      "a",
      "img",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "blockquote",
      "pre",
      "ul",
      "ol",
      "li",
      "table",
      "colgroup",
      "col",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "hr",
      "div",
      "iframe",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      iframe: ["src", "title", "allowfullscreen"],
      ol: ["start"],
      li: ["value", "aria-checked", "style"],
      p: ["style"],
      h1: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      h5: ["style"],
      h6: ["style"],
      span: ["style"],
      th: ["colspan", "rowspan", "style"],
      td: ["colspan", "rowspan", "style"],
      div: ["data-youtube-video-id", "style"],
    },
    // class를 속성으로 열면 사이트의 모든 Tailwind 클래스(예: fixed inset-0)를 쓸 수 있어 화면을 덮는 가짜 창을 만들 수 있다.
    // 화면에 필요한 클래스만 이름으로 허용한다.
    allowedClasses: {
      a: ["mention", "youtube-link-card__link"],
      div: [
        "youtube-link-card",
        "youtube-link-card__thumbnail",
        "youtube-link-card__description",
        "post-layout",
      ],
      ul: ["post-checklist"],
    },
    allowedStyles: {
      "*": TEXT_STYLES,
      div: { ...TEXT_STYLES, "grid-template-columns": [GRID_COLUMNS] },
    },
    allowedSchemes: ["https", "mailto"],
    allowedSchemesByTag: { img: ["https"], iframe: ["https"] },
    allowProtocolRelative: false,
    allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com"],
    transformTags: {
      a: (tagName, attribs) => {
        const rel = new Set(typeof attribs.rel === "string" ? attribs.rel.split(/\s+/) : []);
        rel.add("noopener");
        if (attribs.target === "_blank") rel.add("noreferrer");
        rel.delete("");
        return { tagName, attribs: { ...attribs, rel: [...rel].join(" ") } };
      },
      img: (tagName, attribs) => {
        const { src, width, height, ...rest } = attribs;
        const resolved = resolveImage(src);
        return {
          tagName,
          attribs: {
            ...rest,
            ...(resolved ? { src: resolved } : {}),
            ...(width && DIMENSION.test(width) ? { width } : {}),
            ...(height && DIMENSION.test(height) ? { height } : {}),
          },
        };
      },
      // 에디터가 붙이는 표시용 속성을 화면용 클래스로 바꾼다. 같은 클래스를 직접 넣어도 레이아웃만 바뀐다.
      div: (tagName, attribs) =>
        attribs["data-lexical-layout-container"] === "true"
          ? { tagName, attribs: { ...attribs, class: "post-layout" } }
          : { tagName, attribs },
      ul: (tagName, attribs) =>
        attribs.__lexicallisttype === "check"
          ? { tagName, attribs: { ...attribs, class: "post-checklist" } }
          : { tagName, attribs },
    },
    // 주소가 없거나 허용되지 않아 비어 버린 이미지·영상은 태그째 지운다.
    exclusiveFilter: (frame) =>
      (frame.tag === "img" && !frame.attribs.src) ||
      (frame.tag === "iframe" && !YOUTUBE_EMBED.test(frame.attribs.src ?? "")),
  });
}

/** 저장할 HTML을 정제한다. 우리 Storage 이미지는 상대 경로로 바꿔 둔다. */
export function sanitizePostHtmlForStorage(html: string): string {
  return sanitize(html, storedImageSource);
}

/** 보여 줄 HTML을 정제한다. DB의 값도 믿지 않고 다시 거르며, 이미지 상대 경로를 공개 주소로 바꾼다. */
export function renderPostContentHtml(html: string): string {
  return sanitize(html, displayedImageSource);
}

function isSerializedEditorState(value: unknown): value is SerializedEditorState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const root = (value as { root?: unknown }).root;
  return (
    !!root && typeof root === "object" && Array.isArray((root as { children?: unknown }).children)
  );
}

// 글 안에서 문단을 나누지 않는 요소. 나머지 요소(문단·제목·목록·표 등)는 줄을 바꿔 잇는다.
const INLINE_ELEMENT_TYPES = new Set(["link", "autolink"]);
// 입력 중에만 보이는 자동 완성 제안은 본문이 아니다.
const IGNORED_NODE_TYPES = new Set(["autocomplete"]);

function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const { type, text, children } = node as { type?: unknown; text?: unknown; children?: unknown };
  if (typeof type === "string" && IGNORED_NODE_TYPES.has(type)) return "";
  if (type === "linebreak") return "\n";
  if (type === "tab") return "\t";
  if (typeof text === "string") return text;
  if (!Array.isArray(children)) return "";

  return children
    .map((child) => {
      const childText = nodeText(child);
      const childType = (child as { type?: unknown })?.type;
      const isBlock =
        !!child &&
        typeof child === "object" &&
        Array.isArray((child as { children?: unknown }).children) &&
        !(typeof childType === "string" && INLINE_ELEMENT_TYPES.has(childType));
      return isBlock ? `${childText}\n` : childText;
    })
    .join("");
}

/** 검색용 본문 텍스트를 에디터 JSON에서 뽑는다. 문단·제목·목록 항목은 줄바꿈으로 나눈다. */
export function extractPostText(contentJson: unknown): string {
  if (!isSerializedEditorState(contentJson)) {
    throw new Error("유효하지 않은 형식입니다.");
  }
  return nodeText(contentJson.root)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
