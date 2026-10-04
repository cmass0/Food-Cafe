import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { JSDOM } from "jsdom";
import { createHeadlessEditor } from "@lexical/headless";
import { $createLinkNode } from "@lexical/link";
import { $createListItemNode, $createListNode } from "@lexical/list";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  type LexicalNode,
  type SerializedEditorState,
} from "lexical";

import { $createImageNode } from "@/components/editor/nodes/image-node";
import { $createMentionNode } from "@/components/editor/nodes/mention-node";

import { exportPostHtml } from "./export-html";
import { nodes } from "./nodes";

// 에디터의 HTML 변환은 브라우저의 document를 쓴다. 서버 모듈(정제)도 함께 불러야 해서 Node 환경을 유지하고,
// 브라우저 객체는 이 파일 안에서만 흉내 냈다가 끝나면 치운다.
beforeAll(() => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

// 에디터에서 만든 것과 같은 JSON을 준비한다.
function editorState(...blocks: (() => LexicalNode)[]): SerializedEditorState {
  const editor = createHeadlessEditor({
    nodes,
    onError: (error) => {
      throw error;
    },
  });
  editor.update(
    () =>
      $getRoot()
        .clear()
        .append(...blocks.map((make) => make())),
    {
      discrete: true,
    }
  );
  return editor.getEditorState().toJSON();
}

const paragraph =
  (...children: (() => LexicalNode)[]) =>
  () =>
    $createParagraphNode().append(...children.map((make) => make()));
const text = (value: string) => () => $createTextNode(value);
const link = (url: string) => () => $createLinkNode(url).append($createTextNode(url));

describe("exportPostHtml", () => {
  test("제목·인용·밑줄 서식을 HTML 태그로 내보낸다", () => {
    const html = exportPostHtml(
      editorState(
        () => $createHeadingNode("h2").append($createTextNode("소제목")),
        () => $createQuoteNode().append($createTextNode("인용문")),
        paragraph(() => $createTextNode("밑줄").toggleFormat("underline"))
      )
    );

    expect(html).toBe(
      '<h2><span style="white-space: pre-wrap;">소제목</span></h2>' +
        '<blockquote><span style="white-space: pre-wrap;">인용문</span></blockquote>' +
        '<p><u><span style="white-space: pre-wrap;">밑줄</span></u></p>'
    );
  });

  test("이미지는 저장소 상대 경로를 그대로 쓴다", () => {
    const html = exportPostHtml(
      editorState(
        paragraph(() =>
          $createImageNode({
            src: "posts/user-1/post-1/a.jpg",
            altText: "사진",
            width: 0,
            height: 0,
          })
        )
      )
    );

    expect(html).toContain('src="posts/user-1/post-1/a.jpg"');
  });

  test("유튜브 주소만 있는 문단을 썸네일 카드로 바꾼다", () => {
    const html = exportPostHtml(editorState(paragraph(link("https://youtu.be/dQw4w9WgXcQ"))));

    expect(html).toContain('<div class="youtube-link-card" data-youtube-video-id="dQw4w9WgXcQ">');
    expect(html).toContain('src="https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg"');
    expect(html).not.toContain("<p>");
  });

  test("문장 안의 유튜브 링크는 카드로 바꾸지 않는다", () => {
    const html = exportPostHtml(
      editorState(paragraph(text("영상: "), link("https://youtu.be/dQw4w9WgXcQ")))
    );

    expect(html).not.toContain("youtube-link-card");
    expect(html).toContain('<a href="https://youtu.be/dQw4w9WgXcQ">');
  });

  test.each([
    ["유튜브가 아닌 주소", "https://example.com/watch?v=dQw4w9WgXcQ"],
    ["영상 id 길이가 틀린 주소", "https://youtu.be/short"],
  ] as const)("%s만 있는 문단은 카드로 바꾸지 않는다", (_label, url) => {
    expect(exportPostHtml(editorState(paragraph(link(url))))).not.toContain("youtube-link-card");
  });

  test("빈 문서는 빈 문단 하나로 내보낸다", () => {
    expect(exportPostHtml(editorState(paragraph()))).toBe("<p><br></p>");
  });
});

describe("에디터 HTML과 서버 정제의 약속", () => {
  // 브라우저가 만든 HTML이 서버 허용 목록을 통과해야 글에 넣은 서식이 화면에 남는다.
  test.each([
    ["제목", () => $createHeadingNode("h2").append($createTextNode("소제목")), "<h2>"],
    ["인용", () => $createQuoteNode().append($createTextNode("인용문")), "<blockquote>"],
    ["취소선", paragraph(() => $createTextNode("취소").toggleFormat("strikethrough")), "<s>"],
    [
      "체크리스트",
      () =>
        $createListNode("check").append($createListItemNode(true).append($createTextNode("완료"))),
      '<ul class="post-checklist"><li aria-checked="true"',
    ],
    [
      "글자색",
      paragraph(() => $createTextNode("빨강").setStyle("color: #e03131;")),
      'style="color:rgb(224, 49, 49);white-space:pre-wrap"',
    ],
    [
      "멘션",
      paragraph(() => $createMentionNode("요리왕", "11111111-1111-4111-8111-111111111111")),
      '<a class="mention" href="/profile/11111111-1111-4111-8111-111111111111"',
    ],
    [
      "가운데 정렬",
      () => $createParagraphNode().append($createTextNode("가운데")).setFormat("center"),
      'style="text-align:center"',
    ],
  ] as const)("%s 서식은 서버 정제 뒤에도 남는다", async (_label, block, expected) => {
    const { sanitizePostHtmlForStorage } = await import("@/domain/post/content");

    expect(sanitizePostHtmlForStorage(exportPostHtml(editorState(block)))).toContain(expected);
  });
});
