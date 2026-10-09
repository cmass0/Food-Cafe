import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

import { toActionErrorMessage } from "@/lib/errors/action";
import { POST_USER_FACING_ERRORS } from "./messages";
import {
  POST_CONTENT_TOO_LARGE_MESSAGE,
  POST_TEXT_MAX_CHARS,
  POST_TEXT_TOO_LONG_MESSAGE,
} from "./schema";

vi.mock("server-only", () => ({}));

const PUBLIC_PREFIX = "https://project.supabase.co/storage/v1/object/public/food-images/";

let content: typeof import("./content");

beforeAll(async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", "food-images");
  vi.resetModules();
  content = await import("./content");
});

afterAll(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("게시글 HTML 정제 — 차단", () => {
  test.each([
    ["script 태그", "<p>본문<script>alert(1)</script></p>", "<script"],
    ["이벤트 속성", '<p onclick="steal()">본문</p>', "onclick"],
    ["이미지 onerror", '<img src="https://example.com/a.png" onerror="steal()">', "onerror"],
    ["javascript 링크", '<a href="javascript:alert(1)">링크</a>', "javascript:"],
    ["프로토콜 상대 링크", '<a href="//evil.example/x">링크</a>', "evil.example"],
    ["http 이미지", '<img src="http://evil.example/a.png">', "evil.example"],
    [
      "유튜브가 아닌 iframe",
      '<iframe src="https://evil.example/embed/x"></iframe>',
      "evil.example",
    ],
    [
      "embed 주소가 아닌 유튜브 iframe",
      '<iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>',
      "<iframe",
    ],
    ["허용하지 않은 스타일", '<p style="position:fixed;inset:0">본문</p>', "position"],
    ["색 값이 아닌 color", '<span style="color: expression(alert(1))">본문</span>', "expression"],
    [
      "외부 주소를 부르는 배경",
      '<span style="background-color: url(https://track.example/p.png)">본문</span>',
      "track.example",
    ],
    ["화면을 덮는 클래스", '<div class="fixed inset-0 z-50">가짜 창</div>', "fixed"],
    ["form 태그", '<form action="https://evil.example"><input name="pw"></form>', "<form"],
    ["저장소 밖 상대 경로 이미지", '<img src="/auth/signout">', "/auth/signout"],
    [
      "허용하지 않은 열 비율",
      '<div style="grid-template-columns: repeat(99, 1fr)">칸</div>',
      "repeat",
    ],
  ] as const)("%s은 저장 결과에서 제거한다", (_label, input, forbidden) => {
    expect(content.sanitizePostHtmlForStorage(input)).not.toContain(forbidden);
  });

  test("DB에 직접 넣은 위험한 HTML도 보여 줄 때 다시 제거한다", () => {
    const html = content.renderPostContentHtml(
      '<p onclick="steal()">본문</p><div class="fixed inset-0">가짜 창</div><script>alert(1)</script>'
    );

    expect(html).toBe("<p>본문</p><div>가짜 창</div>");
  });

  test("빈 HTML은 빈 문자열로 남는다", () => {
    expect(content.sanitizePostHtmlForStorage("")).toBe("");
  });
});

describe("게시글 HTML 정제 — 허용 서식", () => {
  test.each([
    ["제목", "<h2>소제목</h2>"],
    ["인용", "<blockquote>인용문</blockquote>"],
    ["굵게·기울임", "<p><b><strong>굵게</strong></b><i><em>기울임</em></i></p>"],
    ["밑줄·취소선", "<p><u>밑줄</u><s>취소선</s></p>"],
    ["인라인 코드·첨자", "<p><code>a</code><sup>1</sup><sub>2</sub></p>"],
    ["코드 블록", "<pre><span>const a = 1;</span></pre>"],
    ["구분선", "<hr />"],
    ["표", "<table><tbody><tr><th>머리</th><td>칸</td></tr></tbody></table>"],
    ["번호 목록 시작 값", '<ol start="3"><li value="3">항목</li></ol>'],
    [
      "글자색·배경색",
      '<p><span style="color:rgb(224, 49, 49);background-color:#ffec99">색</span></p>',
    ],
    ["정렬", '<p style="text-align:center">가운데</p>'],
    ["띄어쓰기 보존", '<p><span style="white-space:pre-wrap">a  b</span></p>'],
  ] as const)("%s 서식을 그대로 남긴다", (_label, html) => {
    expect(content.sanitizePostHtmlForStorage(html)).toBe(html);
  });

  test("에디터의 체크리스트를 화면용 클래스로 바꾸고 체크 상태를 남긴다", () => {
    const html = content.sanitizePostHtmlForStorage(
      '<ul __lexicallisttype="check"><li role="checkbox" tabindex="-1" aria-checked="true" value="1">완료</li></ul>'
    );

    expect(html).toBe(
      '<ul class="post-checklist"><li aria-checked="true" value="1">완료</li></ul>'
    );
  });

  test("에디터의 열 나누기를 화면용 클래스로 바꾸고 열 비율만 남긴다", () => {
    const html = content.sanitizePostHtmlForStorage(
      '<div style="grid-template-columns: 1fr 1fr;" data-lexical-layout-container="true"><div>왼쪽</div><div>오른쪽</div></div>'
    );

    expect(html).toBe(
      '<div style="grid-template-columns:1fr 1fr" class="post-layout"><div>왼쪽</div><div>오른쪽</div></div>'
    );
  });

  test("멘션은 프로필 상대 주소와 mention 클래스만 남긴다", () => {
    const html = content.sanitizePostHtmlForStorage(
      '<a data-lexical-mention="true" class="mention" href="/profile/user-1">@요리왕</a>'
    );

    expect(html).toBe('<a class="mention" href="/profile/user-1" rel="noopener">@요리왕</a>');
  });

  test("새 창 링크에 noopener와 noreferrer를 붙인다", () => {
    const html = content.sanitizePostHtmlForStorage(
      '<a href="https://example.com" target="_blank">링크</a>'
    );

    expect(html).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">링크</a>'
    );
  });

  test("유튜브 embed iframe은 주소·제목·전체 화면 속성만 남긴다", () => {
    const html = content.sanitizePostHtmlForStorage(
      '<iframe data-lexical-youtube="dQw4w9WgXcQ" width="560" height="315" src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" frameborder="0" allowfullscreen="true" title="YouTube video"></iframe>'
    );

    expect(html).toBe(
      '<iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ" allowfullscreen="true" title="YouTube video"></iframe>'
    );
  });

  test("유튜브 링크 카드 구조를 남긴다", () => {
    const card = (image: string) =>
      '<div class="youtube-link-card" data-youtube-video-id="dQw4w9WgXcQ">' +
      '<a class="youtube-link-card__link" href="https://youtu.be/dQw4w9WgXcQ" target="_blank" rel="noopener noreferrer">' +
      `<div class="youtube-link-card__thumbnail">${image}</div>` +
      '<div class="youtube-link-card__description"><strong>YouTube 동영상</strong><div>youtube.com에서 보기</div></div>' +
      "</a></div>";
    const thumbnail = "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg";

    expect(
      content.sanitizePostHtmlForStorage(
        card(`<img src="${thumbnail}" alt="YouTube 동영상 썸네일" />`)
      )
    ).toBe(card(`<img alt="YouTube 동영상 썸네일" src="${thumbnail}" />`));
  });

  test("이미지 크기는 숫자일 때만 남긴다", () => {
    expect(
      content.sanitizePostHtmlForStorage(
        '<img src="https://example.com/a.png" alt="a" width="inherit" height="300">'
      )
    ).toBe('<img alt="a" src="https://example.com/a.png" height="300" />');
  });
});

describe("게시글 이미지 주소", () => {
  test("저장할 때 우리 Storage 공개 주소를 상대 경로로 바꾼다", () => {
    expect(
      content.sanitizePostHtmlForStorage(
        `<img src="${PUBLIC_PREFIX}posts/user-1/post-1/a.jpg" alt="a">`
      )
    ).toBe('<img alt="a" src="posts/user-1/post-1/a.jpg" />');
  });

  test("저장할 때 외부 https 이미지는 그대로 둔다", () => {
    expect(
      content.sanitizePostHtmlForStorage('<img src="https://cdn.example.com/a.jpg" alt="a">')
    ).toBe('<img alt="a" src="https://cdn.example.com/a.jpg" />');
  });

  test("보여 줄 때 상대 경로를 공개 주소로 바꾼다", () => {
    expect(
      content.renderPostContentHtml(
        '<p><img src="posts/user-1/post-1/a b.jpg" alt="본문 이미지"></p>'
      )
    ).toBe(`<p><img alt="본문 이미지" src="${PUBLIC_PREFIX}posts/user-1/post-1/a%20b.jpg" /></p>`);
  });

  test("보여 줄 때도 저장소 밖 상대 경로 이미지는 태그째 지운다", () => {
    expect(content.renderPostContentHtml('<p>앞<img src="api/x" alt="x">뒤</p>')).toBe(
      "<p>앞뒤</p>"
    );
  });
});

const text = (value: string, type = "text") => ({ type, text: value });
const element = (type: string, children: unknown[]) => ({ type, children });

describe("저장할 HTML 길이", () => {
  test("정제하며 문자 참조로 늘어나 20만 자를 넘으면 본문 크기 안내로 거절한다", () => {
    // 6만 자의 맨 &는 정제 후 &amp;(5자)가 되어 30만 자가 된다. 정제 전 길이만 보면 앱은 통과시킨다.
    const html = `<p>${"&".repeat(60_000)}</p>`;

    expect(() => content.sanitizePostHtmlForStorage(html)).toThrow(POST_CONTENT_TOO_LARGE_MESSAGE);
  });

  test("정제 후 20만 자까지는 저장한다", () => {
    const html = `<p>${"가".repeat(199_993)}</p>`;

    expect(content.sanitizePostHtmlForStorage(html)).toHaveLength(200_000);
  });
});

describe("extractPostText", () => {
  test("문단·제목·목록 항목 사이에 에디터처럼 빈 줄을 넣어 글자만 뽑는다", () => {
    const state = {
      root: element("root", [
        element("heading", [text("소제목")]),
        element("paragraph", [text("첫 "), text("문단", "text")]),
        element("list", [element("listitem", [text("하나")]), element("listitem", [text("둘")])]),
      ]),
    };

    expect(content.extractPostText(state)).toBe("소제목\n\n첫 문단\n\n하나\n\n둘");
  });

  test("링크 안의 글자는 문단을 나누지 않는다", () => {
    const state = {
      root: element("root", [
        element("paragraph", [text("앞 "), element("link", [text("링크")]), text(" 뒤")]),
      ]),
    };

    expect(content.extractPostText(state)).toBe("앞 링크 뒤");
  });

  test("줄바꿈·탭 노드를 글자로 바꾼다", () => {
    const state = {
      root: element("root", [
        element("paragraph", [
          text("a"),
          { type: "linebreak" },
          text("b"),
          { type: "tab" },
          text("c"),
        ]),
      ]),
    };

    expect(content.extractPostText(state)).toBe("a\nb\tc");
  });

  test("입력 중 자동 완성 제안은 본문에 넣지 않는다", () => {
    const state = {
      root: element("root", [element("paragraph", [text("김치"), text("찌개", "autocomplete")])]),
    };

    expect(content.extractPostText(state)).toBe("김치");
  });

  test("유튜브·트윗 임베드는 에디터와 같은 링크로 세고, 꾸밈 블록이라 앞뒤에 줄을 넣지 않는다", () => {
    const state = {
      root: element("root", [
        element("paragraph", [text("앞")]),
        { type: "youtube", videoID: "abc123", version: 1 },
        { type: "tweet", id: "1234567890", version: 1 },
        element("paragraph", [text("뒤")]),
      ]),
    };

    expect(content.extractPostText(state)).toBe(
      "앞\n\nhttps://www.youtube.com/watch?v=abc123https://x.com/i/web/status/1234567890뒤"
    );
  });

  test("수평선은 줄바꿈 하나로 센다", () => {
    const state = {
      root: element("root", [
        element("paragraph", [text("위")]),
        { type: "horizontalrule", version: 1 },
        element("paragraph", [text("아래")]),
      ]),
    };

    expect(content.extractPostText(state)).toBe("위\n\n\n아래");
  });

  test("글 앞뒤 공백과 빈 문단도 에디터처럼 그대로 센다", () => {
    const state = {
      root: element("root", [
        element("paragraph", [text(" 가 ")]),
        element("paragraph", []),
        element("paragraph", [text("나")]),
      ]),
    };

    expect(content.extractPostText(state)).toBe(" 가 \n\n\n\n나");
  });

  test("넘침 표시 요소는 에디터처럼 블록으로 세어 뒤에 빈 줄을 넣는다", () => {
    const state = {
      root: element("root", [
        element("paragraph", [text("앞"), element("overflow", [text("넘침")]), text("뒤")]),
      ]),
    };

    expect(content.extractPostText(state)).toBe("앞넘침\n\n뒤");
  });

  test.each([
    ["ID 없는 유튜브", { type: "youtube" }],
    ["빈 ID 트윗", { type: "tweet", id: "" }],
    ["숫자 ID 트윗", { type: "tweet", id: 1234 }],
  ] as const)("%s 임베드는 글자를 만들지 않는다", (_label, node) => {
    const state = { root: element("root", [node]) };

    expect(content.extractPostText(state)).toBe("");
  });

  test("이미지·영상만 있는 문서는 빈 문자열을 돌려준다", () => {
    const state = { root: element("root", [{ type: "image", src: "posts/u/p/a.jpg" }]) };

    expect(content.extractPostText(state)).toBe("");
  });

  test.each([
    ["null", null],
    ["root 없는 객체", { children: [] }],
    ["children 없는 root", { root: {} }],
    ["배열", []],
  ] as const)("%s 형식은 거부한다", (_label, value) => {
    expect(() => content.extractPostText(value)).toThrow("유효하지 않은 형식입니다.");
  });
});

describe("extractPostText — 본문 글자 상한", () => {
  const paragraphs = (...values: string[]) => ({
    root: element(
      "root",
      values.map((value) => element("paragraph", [text(value)]))
    ),
  });

  test("상한과 같은 글자 수는 그대로 돌려준다", () => {
    const state = paragraphs("가".repeat(POST_TEXT_MAX_CHARS));

    expect(content.extractPostText(state)).toHaveLength(POST_TEXT_MAX_CHARS);
  });

  test("상한을 한 글자 넘으면 거절한다", () => {
    const state = paragraphs("가".repeat(POST_TEXT_MAX_CHARS + 1));

    expect(() => content.extractPostText(state)).toThrow(POST_TEXT_TOO_LONG_MESSAGE);
  });

  test("문단 사이 빈 줄도 에디터처럼 글자 수에 넣는다", () => {
    const half = (POST_TEXT_MAX_CHARS - 2) / 2;
    const fits = paragraphs("가".repeat(half), "나".repeat(half));
    const over = paragraphs("가".repeat(half + 1), "나".repeat(half));

    expect(content.extractPostText(fits)).toHaveLength(POST_TEXT_MAX_CHARS);
    expect(() => content.extractPostText(over)).toThrow(POST_TEXT_TOO_LONG_MESSAGE);
  });

  test("상한 초과 안내는 기본 오류 문구로 바뀌지 않고 사용자에게 그대로 보인다", () => {
    const error = (() => {
      try {
        content.extractPostText(paragraphs("가".repeat(POST_TEXT_MAX_CHARS + 1)));
      } catch (caught) {
        return caught;
      }
    })();

    expect(toActionErrorMessage(error, POST_USER_FACING_ERRORS)).toBe(POST_TEXT_TOO_LONG_MESSAGE);
  });

  test("이모지는 에디터처럼 2자로 센다", () => {
    const emojis = (count: number) => paragraphs("😀".repeat(count));

    expect(content.extractPostText(emojis(POST_TEXT_MAX_CHARS / 2))).toHaveLength(
      POST_TEXT_MAX_CHARS
    );
    expect(() => content.extractPostText(emojis(POST_TEXT_MAX_CHARS / 2 + 1))).toThrow(
      POST_TEXT_TOO_LONG_MESSAGE
    );
  });
});
