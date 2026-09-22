import { afterEach, describe, expect, test, vi } from "vitest";
import { JSDOM } from "jsdom";

import type { RecommendationCandidate } from "@/domain/recommend/types";
import type { RecommendAgentUIMessage } from "@/features/recommend/agent";
import {
  loadRecommendMessages,
  RECOMMEND_SESSION_KEY,
  restoreRecommendMessages,
  saveRecommendMessages,
} from "./session";

const RECIPE: RecommendationCandidate = {
  sourceType: "recipe",
  id: "00000000-0000-4000-8000-000000000001",
  title: "계란볶음밥",
  summary: "팬 하나로 만드는 한 끼",
  category: "한식",
  tags: ["간단"],
  tools: ["팬"],
  toolsRequired: true,
  difficulty: "쉬움",
  timeMinutes: 10,
  servings: 1,
  ingredients: [],
  ingredientCount: 0,
  likeCount: 0,
  bookmarkCount: 0,
  commentCount: 0,
  viewCount: 0,
  rank: { score: 0.1, keywordRank: 1, semanticRank: 1, semanticSimilarity: 0.8 },
};
const COMBO: RecommendationCandidate = {
  sourceType: "combo",
  id: "00000000-0000-4000-8000-000000000002",
  title: "볶음밥과 샐러드",
  summary: null,
  items: [],
  itemCount: 0,
  tags: [],
  tools: [],
  toolsRequired: false,
  difficulty: null,
  timeMinutes: null,
  likeCount: 0,
  bookmarkCount: 0,
  commentCount: 0,
  viewCount: 0,
  rank: { score: 0.05, keywordRank: null, semanticRank: 2, semanticSimilarity: 0.7 },
};
const MESSAGES: [RecommendAgentUIMessage, RecommendAgentUIMessage] = [
  { id: "user-1", role: "user", parts: [{ type: "text", text: "간단한 요리 추천해줘" }] },
  {
    id: "assistant-1",
    role: "assistant",
    parts: [
      { type: "step-start" },
      {
        type: "tool-searchRecommendations",
        toolCallId: "search-1",
        state: "output-available",
        input: {
          query: "간단한 요리",
          sourceTypes: ["recipe", "combo"],
          includeIngredients: [],
          excludeIngredients: [],
        },
        output: {
          items: [RECIPE, COMBO],
          query: "간단한 요리",
          appliedFilters: {
            sourceTypes: ["recipe", "combo"],
            category: null,
            difficulty: null,
            maxTimeMinutes: null,
            toolsRequired: null,
            includeIngredients: [],
            excludeIngredients: [],
          },
        },
      },
      { type: "text", text: "볶음밥을 추천해요.", state: "done" },
    ],
  },
];

let browser: JSDOM | undefined;

afterEach(() => {
  browser?.window.close();
  browser = undefined;
  vi.unstubAllGlobals();
});

function setupStorage() {
  browser = new JSDOM("", { url: "https://food-cafe.test" });
  vi.stubGlobal("window", browser.window);
  return browser.window.sessionStorage;
}

describe("restoreRecommendMessages", () => {
  test("사용자 대화와 레시피·조합 카드의 전체 결과 및 메시지 ID를 복원한다", async () => {
    const restored = await restoreRecommendMessages(JSON.stringify(MESSAGES));

    expect(restored).toEqual([
      { ...MESSAGES[0], parts: [{ ...MESSAGES[0].parts[0], state: "done" }] },
      MESSAGES[1],
    ]);
  });

  test.each([
    ["없는 저장값", null],
    ["빈 문자열", ""],
    ["공백", "   "],
    ["손상된 JSON", "{"],
    ["null JSON", "null"],
    ["빈 대화", "[]"],
    ["객체", "{}"],
    ["메시지 아닌 값", "[1]"],
    ["본문이 없는 사용자 메시지", '[{"id":"a","role":"user","parts":[]}]'],
    ["문자열 아닌 본문", '[{"id":"a","role":"user","parts":[{"type":"text","text":1}]}]'],
  ] as const)("%s이면 빈 대화로 복구한다", async (_label, serialized) => {
    expect(await restoreRecommendMessages(serialized)).toEqual([]);
  });

  test.each([
    ["결과 누락", {}],
    ["배열 아닌 목록", { items: {} }],
    ["손상된 카드", { items: [null] }],
    ["알 수 없는 종류", { items: [{ ...RECIPE, sourceType: "post" }] }],
    ["잘못된 링크 ID", { items: [{ ...RECIPE, id: "../admin" }] }],
    ["객체인 제목", { items: [{ ...RECIPE, title: {} }] }],
    ["객체인 설명", { items: [{ ...RECIPE, summary: {} }] }],
  ] as const)("%s이 있는 카드 결과는 복원하지 않는다", async (_label, output) => {
    const serialized = JSON.stringify([
      { ...MESSAGES[1], parts: [{ ...MESSAGES[1].parts[1], output }] },
    ]);
    expect(await restoreRecommendMessages(serialized)).toEqual([]);
  });

  test("검색 결과가 0건인 답변도 보존한다", async () => {
    const messages = [
      {
        ...MESSAGES[1],
        parts: [{ ...MESSAGES[1].parts[1], output: { items: [] } }],
      },
    ];
    expect(await restoreRecommendMessages(JSON.stringify(messages))).toEqual(messages);
  });

  test.each(["input-streaming", "input-available"] as const)(
    "%s에서 이동하면 복원한 검색을 종료 상태로 처리한다",
    async (state) => {
      const restored = await restoreRecommendMessages(
        JSON.stringify([
          {
            id: "assistant-2",
            role: "assistant",
            parts: [
              { type: "text", text: "추천을", state: "streaming" },
              { type: "tool-searchRecommendations", toolCallId: "search-2", state, input: {} },
            ],
          },
        ])
      );

      expect(restored).toEqual([
        {
          id: "assistant-2",
          role: "assistant",
          parts: [
            { type: "text", text: "추천을", state: "done" },
            {
              type: "tool-searchRecommendations",
              toolCallId: "search-2",
              state: "output-error",
              input: undefined,
              errorText: "페이지를 이동하여 추천 검색이 중단됐습니다. 다시 요청해 주세요.",
            },
          ],
        },
      ]);
    }
  );

  test("이미 실패한 검색의 오류 상태를 보존한다", async () => {
    const messages = [
      {
        id: "assistant-error",
        role: "assistant",
        parts: [
          {
            type: "tool-searchRecommendations",
            toolCallId: "failed-search",
            state: "output-error",
            errorText: "검색 실패",
          },
        ],
      },
    ];
    expect(await restoreRecommendMessages(JSON.stringify(messages))).toEqual(messages);
  });
});

describe("추천 대화 sessionStorage 연결", () => {
  test("저장 후 다시 읽어도 대화와 카드가 유지된다", async () => {
    setupStorage();

    expect(saveRecommendMessages(MESSAGES)).toBe(true);
    expect(await loadRecommendMessages()).toEqual(
      await restoreRecommendMessages(JSON.stringify(MESSAGES))
    );
  });

  test("빈 대화를 저장하면 채팅 기록만 제거하고 다른 저장값은 유지한다", async () => {
    const storage = setupStorage();
    storage.setItem("unrelated", "keep");
    saveRecommendMessages(MESSAGES);

    expect(saveRecommendMessages([])).toBe(true);
    expect(storage.getItem(RECOMMEND_SESSION_KEY)).toBeNull();
    expect(storage.getItem("unrelated")).toBe("keep");
    expect(await loadRecommendMessages()).toEqual([]);
  });

  test("저장소 접근이 차단되면 빈 대화와 저장 실패 결과를 반환한다", async () => {
    vi.stubGlobal("window", {
      get sessionStorage() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });

    expect(await loadRecommendMessages()).toEqual([]);
    expect(saveRecommendMessages(MESSAGES)).toBe(false);
    expect(saveRecommendMessages([])).toBe(false);
  });

  test("저장 용량을 초과하면 실패를 알리고 기존 기록은 보존한다", () => {
    browser = new JSDOM("", { url: "https://food-cafe.test", storageQuota: 100 });
    vi.stubGlobal("window", browser.window);
    browser.window.sessionStorage.setItem(RECOMMEND_SESSION_KEY, "[]");

    expect(saveRecommendMessages(MESSAGES)).toBe(false);
    expect(browser.window.sessionStorage.getItem(RECOMMEND_SESSION_KEY)).toBe("[]");
  });
});
