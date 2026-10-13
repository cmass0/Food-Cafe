import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { JSDOM } from "jsdom";
import { $createCodeNode } from "@lexical/code";
import { $createHashtagNode } from "@lexical/hashtag";
import { createHeadlessEditor } from "@lexical/headless";
import { $createAutoLinkNode, $createLinkNode } from "@lexical/link";
import { $createListItemNode, $createListNode } from "@lexical/list";
import { $createOverflowNode } from "@lexical/overflow";
import { $createHorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createTableNodeWithDimensions } from "@lexical/table";
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTabNode,
  $createTextNode,
  $getRoot,
  type ElementNode,
  type LexicalNode,
} from "lexical";

import { $createTweetNode } from "@/components/editor/nodes/embeds/tweet-node";
import { $createYouTubeNode } from "@/components/editor/nodes/embeds/youtube-node";
import { $createEmojiNode } from "@/components/editor/nodes/emoji-node";
import { $createImageNode } from "@/components/editor/nodes/image-node";
import { $createKeywordNode } from "@/components/editor/nodes/keyword-node";
import { $createLayoutContainerNode } from "@/components/editor/nodes/layout-container-node";
import { $createLayoutItemNode } from "@/components/editor/nodes/layout-item-node";
import { $createMentionNode } from "@/components/editor/nodes/mention-node";

import { exportPostHtml } from "./export-html";
import { nodes } from "./nodes";

// 에디터는 본문 글자 수를 Lexical의 getTextContent로 세서 막는다. 서버(extractPostText)와 DB 제약도
// 같은 글자를 세야, 에디터가 허용한 글을 서버·DB가 거절하지 않는다. 실제 에디터로 만든 문서로 둘을 맞대 본다.
let extractPostText: typeof import("@/domain/post/content").extractPostText;
let sanitizePostHtmlForStorage: typeof import("@/domain/post/content").sanitizePostHtmlForStorage;
let POST_TEXT_MAX_CHARS: number;

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", "food-images");
  ({ extractPostText, sanitizePostHtmlForStorage } = await import("@/domain/post/content"));
  ({ POST_TEXT_MAX_CHARS } = await import("@/domain/post/schema"));
  // 에디터의 HTML 변환은 브라우저의 document를 쓴다. 이 파일 안에서만 흉내 낸다.
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  vi.stubGlobal("window", dom.window);
  vi.stubGlobal("document", dom.window.document);
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

// 에디터에서 문서를 만들고, 에디터가 센 글자와 저장할 JSON을 함께 돌려준다.
function written(...blocks: (() => LexicalNode)[]) {
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
    { discrete: true }
  );
  const state = editor.getEditorState();
  return { editorText: state.read(() => $getRoot().getTextContent()), json: state.toJSON() };
}

const make =
  (node: () => ElementNode, ...children: (() => LexicalNode)[]) =>
  () =>
    node().append(...children.map((child) => child()));
const paragraph = (...children: (() => LexicalNode)[]) => make($createParagraphNode, ...children);
const text = (value: string) => () => $createTextNode(value);

const DOCUMENTS = [
  [
    "제목·문단·인용",
    [
      make(() => $createHeadingNode("h2"), text("소제목")),
      paragraph(text("첫 "), text("문단")),
      make($createQuoteNode, text("인용")),
    ],
  ],
  [
    "중첩 목록",
    [
      make(
        () => $createListNode("bullet"),
        make($createListItemNode, text("하나")),
        make(
          $createListItemNode,
          make(() => $createListNode("number"), make($createListItemNode, text("안쪽")))
        )
      ),
    ],
  ],
  [
    "코드 블록의 줄바꿈·탭",
    [make($createCodeNode, text("a"), $createLineBreakNode, $createTabNode, text("b"))],
  ],
  ["표", [() => $createTableNodeWithDimensions(2, 2, false)]],
  [
    "링크·자동 링크·넘침 표시",
    [
      paragraph(
        text("앞 "),
        make(() => $createLinkNode("https://example.com"), text("링크")),
        make(() => $createAutoLinkNode("https://a.example"), text("https://a.example")),
        make($createOverflowNode, text("넘침")),
        text(" 뒤")
      ),
    ],
  ],
  [
    "임베드가 문단 사이·연달아 있을 때",
    [
      paragraph(text("앞")),
      () => $createYouTubeNode("abc123"),
      () => $createTweetNode("1234567890"),
      paragraph(text("뒤")),
    ],
  ],
  ["수평선", [paragraph(text("위")), $createHorizontalRuleNode, paragraph(text("아래"))]],
  [
    "이미지",
    [
      paragraph(text("사진 "), () =>
        $createImageNode({ src: "posts/u/p/a.jpg", altText: "사진", width: 0, height: 0 })
      ),
    ],
  ],
  [
    "단 나누기",
    [
      make(
        () => $createLayoutContainerNode("1fr 1fr"),
        make($createLayoutItemNode, paragraph(text("왼쪽"))),
        make($createLayoutItemNode, paragraph(text("오른쪽")))
      ),
    ],
  ],
  [
    "멘션·해시태그·이모지·키워드",
    [
      paragraph(
        () => $createMentionNode("요리왕", "11111111-1111-4111-8111-111111111111"),
        text(" "),
        () => $createHashtagNode("#김치"),
        () => $createEmojiNode("emoji happysmile", "🙂"),
        () => $createKeywordNode("congrats")
      ),
    ],
  ],
  [
    "앞뒤 공백과 빈 문단",
    [paragraph(text("  가  ")), paragraph(), paragraph(), paragraph(text("나 "))],
  ],
  [
    "문단 안 줄바꿈",
    [paragraph(text("가"), $createLineBreakNode, $createLineBreakNode, text("나"))],
  ],
  ["줄바꿈만 있는 문단", [paragraph($createLineBreakNode), paragraph(text("뒤"))]],
  [
    "빈 제목·인용·목록 항목",
    [
      make(() => $createHeadingNode("h3")),
      make($createQuoteNode),
      make(() => $createListNode("bullet"), make($createListItemNode), make($createListItemNode)),
    ],
  ],
  [
    "임베드·수평선이 연달아 있을 때",
    [
      () => $createTweetNode("1111111111"),
      () => $createTweetNode("2222222222"),
      () => $createYouTubeNode("abcdefghijk"),
      $createHorizontalRuleNode,
      $createHorizontalRuleNode,
      paragraph(text("끝")),
    ],
  ],
  [
    "유튜브 주소만 있는 문단(카드로 바뀜)",
    [
      paragraph(
        make(
          () => $createAutoLinkNode("https://youtu.be/abcdefghijk"),
          text("https://youtu.be/abcdefghijk")
        )
      ),
    ],
  ],
] as const;

describe("본문 글자 — 에디터와 서버가 같은 글자를 센다", () => {
  test.each(DOCUMENTS)("%s", (_label, blocks) => {
    const { editorText, json } = written(...blocks);

    expect(extractPostText(json)).toBe(editorText);
  });
});

// 서버는 화면에 보일 HTML의 글자도 같은 상한으로 확인한다. 에디터가 만든 HTML은 문단 사이 빈 줄이 없고
// 임베드를 짧은 카드로 바꾸므로 에디터 글자보다 길어지지 않아야 한다. 각 문서를 상한까지 채워 본다.
describe("에디터가 허용한 글 — 화면에 보일 HTML 검사도 통과한다", () => {
  test.each(DOCUMENTS)("%s를 상한까지 채운 글", (_label, blocks) => {
    const base = written(...blocks).editorText.length;
    const padding = "가".repeat(POST_TEXT_MAX_CHARS - base - 2);
    const { editorText, json } = written(...blocks, paragraph(text(padding)));

    expect(editorText).toHaveLength(POST_TEXT_MAX_CHARS);
    expect(sanitizePostHtmlForStorage(exportPostHtml(json))).toContain(padding);
  });
});
