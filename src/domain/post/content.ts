import "server-only";

import type { SerializedEditorState } from "lexical";
import sanitizeHtml from "sanitize-html";

import { managedStoragePathFromValue, resolveStorageImageUrl } from "@/lib/storage/paths";
import { tweetUrl, youtubeWatchUrl } from "./embed-links";
import {
  POST_CONTENT_MAX_CHARS,
  POST_CONTENT_TOO_LARGE_MESSAGE,
  POST_TEXT_MAX_CHARS,
  POST_TEXT_TOO_LONG_MESSAGE,
} from "./schema";

// 게시글 본문 HTML은 브라우저 에디터가 만들어 보낸다(components/blocks/editor-x/export-html.ts).
// 글쓴이가 요청을 직접 꾸며 보낼 수 있는 값이라 믿지 않고(DB 직접 쓰기는 RLS가 막는다), 저장할 때와 보여 줄 때 모두
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
  const sanitized = sanitize(html, storedImageSource);
  // 입력 검사는 정제 전 길이를 본다. 정제하며 문자 참조(& → &amp; 등)로 늘어나면 DB 상한에 걸릴 수 있어,
  // 실제로 저장할 값으로 한 번 더 확인해 DB 오류 대신 같은 안내로 거절한다.
  if (sanitized.length > POST_CONTENT_MAX_CHARS) throw new Error(POST_CONTENT_TOO_LARGE_MESSAGE);
  // 본문 JSON과 HTML은 따로 들어온다. JSON 글자만 세면 짧은 JSON에 긴 HTML을 붙여 상한을 피할 수 있어,
  // 화면에 보일 글자도 같은 상한으로 확인한다. 에디터가 만든 HTML은 문단 사이 빈 줄이 없고 임베드를
  // 짧은 카드로 바꾸므로 에디터 글자보다 길지 않다(components/blocks/editor-x/post-text.test.ts).
  if (visibleTextLength(sanitized) > POST_TEXT_MAX_CHARS) {
    throw new Error(POST_TEXT_TOO_LONG_MESSAGE);
  }
  return sanitized;
}

// 정제한 HTML에서 화면에 보이는 글자 수를 에디터(Lexical getTextContent)보다 많지 않게 센다.
//   - 글자: 태그·속성은 빼고, 정제가 다시 적은 문자 참조(&amp; 등)는 한 글자
//   - <br>: 한 글자(에디터의 줄바꿈 노드). 빈 블록에 에디터가 자리 표시로 넣는 <br> 하나는 세지 않는다
//   - 블록 사이: 한 글자(에디터는 빈 줄 두 글자). 에디터의 요소 노드가 되는 태그 뒤에 형제가 올 때만 센다.
//     div는 단 나누기(요소)일 수도, 트윗·유튜브 카드(꾸밈 노드, 뒤에 빈 줄 없음)일 수도 있어 세지 않는다
//   - <hr>: 한 글자, 유튜브 영상: 영상 주소 글자 수(에디터의 꾸밈 노드 글자)
// 글자만 세면 짧은 JSON에 <br>·빈 문단·영상만 수천 개 붙인 HTML로 아주 긴 본문을 만들 수 있다.
const ESCAPED_CHARACTER = /&(?:amp|lt|gt|quot);/g;
const SEPARATED_BLOCK_TAGS = new Set([
  "p",
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
  "tr",
  "th",
  "td",
]);
const YOUTUBE_EMBED_ID = /\/embed\/([A-Za-z0-9_-]{11})$/;

type OpenElement = { children: number; onlyLineBreaks: boolean; separatorPending: boolean };

function visibleTextLength(sanitizedHtml: string): number {
  let length = 0;
  const open: OpenElement[] = [{ children: 0, onlyLineBreaks: true, separatorPending: false }];
  const current = () => open[open.length - 1]!;
  const addChild = (isLineBreak: boolean) => {
    const parent = current();
    if (parent.separatorPending) {
      length += 1;
      parent.separatorPending = false;
    }
    parent.children += 1;
    if (!isLineBreak) parent.onlyLineBreaks = false;
  };

  sanitizeHtml(sanitizedHtml, {
    allowedTags: [],
    allowedAttributes: {},
    onOpenTag: (tag, attribs) => {
      addChild(tag === "br");
      if (tag === "br" || tag === "hr") length += 1;
      if (tag === "iframe") {
        const videoId = YOUTUBE_EMBED_ID.exec(attribs.src ?? "")?.[1];
        if (videoId) length += youtubeWatchUrl(videoId).length;
      }
      open.push({ children: 0, onlyLineBreaks: true, separatorPending: false });
    },
    onCloseTag: (tag) => {
      const element = open.pop()!;
      if (!SEPARATED_BLOCK_TAGS.has(tag)) return;
      if (element.children === 1 && element.onlyLineBreaks) length -= 1;
      current().separatorPending = true;
    },
    textFilter: (text) => {
      const visible = text.replace(ESCAPED_CHARACTER, "_");
      if (visible) {
        addChild(false);
        length += visible.length;
      }
      return "";
    },
  });
  return length;
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

// 본문 글자는 에디터(Lexical)의 getTextContent와 같은 규칙으로 만든다. 에디터는 이 글자 수로 본문 길이를 막으므로,
// 서버와 DB 제약이 같은 글자를 세야 에디터가 허용한 글을 거절하지 않는다(components/blocks/editor-x/post-text.test.ts).

// 글 안에 들어가는 요소(Lexical의 isInline()이 true). 나머지 요소(문단·제목·목록·표·단·넘침 표시 등)는 블록이다.
const INLINE_ELEMENT_TYPES = new Set(["link", "autolink"]);
// 입력 중에만 보이는 자동 완성 제안은 본문이 아니다. 에디터는 이 글자도 세므로 서버가 더 적게 셀 뿐이다.
const IGNORED_NODE_TYPES = new Set(["autocomplete"]);
// 자식이 없는 꾸밈 노드(DecoratorNode)의 글자. 임베드는 JSON에 ID만 있어 에디터 노드처럼 링크를 만든다.
// 목록에 없는 꾸밈 노드(이미지 등)는 글자가 없다.
const DECORATOR_TEXT: Record<string, (node: Record<string, unknown>) => string> = {
  youtube: ({ videoID }) =>
    typeof videoID === "string" && videoID ? youtubeWatchUrl(videoID) : "",
  tweet: ({ id }) => (typeof id === "string" && id ? tweetUrl(id) : ""),
  horizontalrule: () => "\n",
};

function isBlockElement(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const { type, children } = node as { type?: unknown; children?: unknown };
  return Array.isArray(children) && !(typeof type === "string" && INLINE_ELEMENT_TYPES.has(type));
}

function nodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const record = node as Record<string, unknown>;
  const { type, text, children } = record;
  if (typeof type === "string" && IGNORED_NODE_TYPES.has(type)) return "";
  if (type === "linebreak") return "\n";
  if (type === "tab") return "\t";
  if (typeof type === "string" && type in DECORATOR_TEXT) return DECORATOR_TEXT[type]!(record);
  if (typeof text === "string") return text;
  if (!Array.isArray(children)) return "";

  // 요소는 자식 글자를 잇고, 마지막이 아닌 블록 요소 뒤에만 빈 줄을 넣는다(꾸밈 블록 뒤에는 넣지 않음).
  return children
    .map((child, index) => {
      const separator = index < children.length - 1 && isBlockElement(child) ? "\n\n" : "";
      return nodeText(child) + separator;
    })
    .join("");
}

/**
 * 본문 글자를 에디터 JSON에서 뽑는다. 검색과 미리보기에 쓰고, 에디터와 같은 글자 수 상한을 여기서 확인해
 * 에디터를 거치지 않은 요청도 같은 선에서 막는다.
 */
export function extractPostText(contentJson: unknown): string {
  if (!isSerializedEditorState(contentJson)) {
    throw new Error("유효하지 않은 형식입니다.");
  }
  const text = nodeText(contentJson.root);
  if (text.length > POST_TEXT_MAX_CHARS) throw new Error(POST_TEXT_TOO_LONG_MESSAGE);
  return text;
}
