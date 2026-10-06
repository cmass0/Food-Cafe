import { createHeadlessEditor } from "@lexical/headless";
import { $generateHtmlFromNodes } from "@lexical/html";
import type { SerializedEditorState } from "lexical";

import { nodes } from "./nodes";

// 게시글을 저장할 때 브라우저에서 본문 HTML을 만든다. 브라우저에는 진짜 DOM이 있어 에디터의 변환 기능을 그대로 쓴다.
// 서버는 이 HTML을 믿지 않고 허용 목록으로 정제만 한다(domain/post/content.ts). 서버에는 DOM을 두지 않는다.

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

/** 유튜브 주소 하나만 있는 문단을 썸네일 카드로 바꾼다. 문장 안의 링크는 그대로 둔다. */
export function enhanceStandaloneYouTubeLinks(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;

  for (const paragraph of Array.from(container.querySelectorAll("p"))) {
    const text = paragraph.textContent?.trim() ?? "";
    const children = Array.from(paragraph.children);
    const onlyLink = children.length === 1 && children[0]?.tagName === "A" ? children[0] : null;
    const href = onlyLink?.getAttribute("href") ?? text;

    if ((children.length === 0 || onlyLink) && text === href) {
      const videoId = getYouTubeVideoId(href);
      if (videoId) paragraph.replaceWith(createYouTubeLinkCard(videoId, href));
    }
  }

  return container.innerHTML;
}

/** 에디터 JSON(이미지 경로까지 확정된 최종본)으로 저장용 본문 HTML을 만든다. */
export function exportPostHtml(state: SerializedEditorState): string {
  const editor = createHeadlessEditor({
    nodes,
    onError: (error) => {
      throw error;
    },
  });
  editor.setEditorState(editor.parseEditorState(JSON.stringify(state)));

  let html = "";
  editor.getEditorState().read(() => {
    html = $generateHtmlFromNodes(editor, null);
  });
  return enhanceStandaloneYouTubeLinks(html);
}
