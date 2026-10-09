import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));

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

import { nodes } from "./nodes";

// 에디터는 본문 글자 수를 Lexical의 getTextContent로 세서 막는다. 서버(extractPostText)와 DB 제약도
// 같은 글자를 세야, 에디터가 허용한 글을 서버·DB가 거절하지 않는다. 실제 에디터로 만든 문서로 둘을 맞대 본다.
let extractPostText: typeof import("@/domain/post/content").extractPostText;

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", "food-images");
  ({ extractPostText } = await import("@/domain/post/content"));
});

afterAll(() => {
  vi.unstubAllEnvs();
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

describe("본문 글자 — 에디터와 서버가 같은 글자를 센다", () => {
  test.each([
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
  ] as const)("%s", (_label, blocks) => {
    const { editorText, json } = written(...blocks);

    expect(extractPostText(json)).toBe(editorText);
  });
});
