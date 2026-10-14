import { describe, expect, test } from "vitest";

import {
  writingRequestSchema,
  writingResponseSchema,
  recipeDraftSchema,
  comboDraftSchema,
} from "./schema";
import type { WritingResponse } from "./types";
import { finalizeWritingResponse } from "./workflow";

const request = {
  kind: "recipe" as const,
  memo: "계란으로 만들어줘",
  formContext: "{}",
  recipeIds: [],
  turns: [],
  outline: null,
  finish: false,
};
const draft = {
  title: "계란찜",
  summary: "부드러운 계란찜",
  chef_tip: "뜨거운 그릇에 주의하세요.",
  category: "한식",
  difficulty: "쉬움",
  time_minutes: 10,
  servings: 1,
  ingredients: [{ name: "계란", amount: "2", unit: "개", unitCustom: "" }],
  steps: [{ description: "계란을 풀어 충분히 익힌다." }],
  tags: ["간단"],
  tools: ["전자레인지"],
};
const response = {
  kind: "recipe" as const,
  outline: { title: "계란찜", points: ["계란", "전자레인지", "1인분"] },
  question: { topic: "간", text: "담백하게 할까요?", options: ["네", "알아서"] },
  draft,
  suggestions: ["분량과 시간은 AI 제안입니다."],
};
const RECIPE_ID = "00000000-0000-4000-8000-000000000001";
const comboRequest = {
  ...request,
  kind: "combo" as const,
  recipeIds: [RECIPE_ID],
};
const comboResponse = {
  kind: "combo" as const,
  outline: response.outline,
  question: null,
  suggestions: [],
  draft: {
    title: "계란찜과 밥",
    summary: "",
    difficulty: "쉬움",
    time_minutes: 10,
    tags: [],
    tools: [],
    steps: [{ description: "함께 먹는다." }],
    items: [
      { type: "recipe" as const, recipeid: RECIPE_ID, title: "계란찜", summary: "" },
      { type: "product" as const, productName: "즉석밥", summary: "" },
    ],
  },
};

describe("작성 도우미 요청과 초안", () => {
  test("정보가 없거나 무관한 메모도 시작할 수 있게 허용한다", () => {
    expect(writingRequestSchema.parse({ ...request, memo: "" }).memo).toBe("");
    expect(writingRequestSchema.parse({ ...request, memo: "우주선 ㅋㅋ" }).memo).toBe(
      "우주선 ㅋㅋ"
    );
  });
  test("다섯 답변은 허용하고 여섯 답변은 거부한다", () => {
    const turn = { question: "원하는 맛은?", answer: "알아서" };
    expect(
      writingRequestSchema.parse({ ...request, turns: Array(5).fill(turn) }).turns
    ).toHaveLength(5);
    const result = writingRequestSchema.safeParse({ ...request, turns: Array(6).fill(turn) });
    expect(result.error?.issues[0]?.path).toEqual(["turns"]);
  });
  test.each([
    [2000, true],
    [2001, false],
  ] as const)("메모 %s자의 허용 여부는 %s이다", (size, allowed) => {
    const result = writingRequestSchema.safeParse({ ...request, memo: "가".repeat(size) });
    expect(result.success).toBe(allowed);
    if (!allowed) expect(result.error?.issues[0]?.path).toEqual(["memo"]);
  });
  test("이미지나 작성자 식별자는 생성 초안에서 제외한다", () => {
    expect(
      recipeDraftSchema.parse({ ...draft, image: "https://fake/image", writer_uid: "fake" })
    ).toEqual(draft);
  });
  test.each([
    ["재료 없음", { ingredients: [] }, "ingredients"],
    ["0인분", { servings: 0 }, "servings"],
    ["음수 시간", { time_minutes: -1 }, "time_minutes"],
    ["없는 분류", { category: "달나라" }, "category"],
    ["없는 단위", { ingredients: [{ name: "계란", amount: "2", unit: "알" }] }, "ingredients"],
  ] as const)("%s인 초안을 거부한다", (_name, patch, field) => {
    const result = recipeDraftSchema.safeParse({ ...draft, ...patch });
    expect(result.error?.issues[0]?.path[0]).toBe(field);
  });
  test("상품 한 개만 있는 조합은 거부한다", () => {
    const result = comboDraftSchema.safeParse({
      title: "한 끼",
      summary: "간단한 식사",
      difficulty: "쉬움",
      time_minutes: 5,
      tags: [],
      tools: [],
      steps: [{ description: "함께 먹는다." }],
      items: [{ type: "product", productName: "컵라면", summary: "" }],
    });
    expect(result.error?.issues[0]?.path).toEqual(["items"]);
  });
});

describe("작성 도우미 종료 규칙", () => {
  test("다섯 번째 답변 후 모델이 질문을 반환해도 완성 초안으로 종료한다", () => {
    const result = finalizeWritingResponse(
      { ...request, turns: Array(5).fill({ question: "맛?", answer: "알아서" }) },
      response
    );
    expect(result.question).toBeNull();
    expect(result.draft?.title).toBe("계란찜");
  });
  test("중간 완료 요청도 질문 없이 종료한다", () => {
    expect(finalizeWritingResponse({ ...request, finish: true }, response).question).toBeNull();
  });
  test("완료 시 초안이 없으면 성공으로 처리하지 않는다", () => {
    expect(() =>
      finalizeWritingResponse({ ...request, finish: true }, { ...response, draft: null })
    ).toThrow("완성 초안이 없습니다.");
  });
  test("질문이 있으면 계속하고 질문도 초안도 없으면 거부한다", () => {
    expect(finalizeWritingResponse(request, { ...response, draft: null }).question?.text).toBe(
      "담백하게 할까요?"
    );
    expect(() =>
      finalizeWritingResponse(request, { ...response, question: null, draft: null })
    ).toThrow("완성 초안이 없습니다.");
  });
  test("사용자가 선택하지 않은 레시피 ID를 조합에 넣지 못한다", () => {
    expect(() => finalizeWritingResponse({ ...request, kind: "combo" }, comboResponse)).toThrow(
      "선택하지 않은 레시피"
    );
    expect(finalizeWritingResponse(comboRequest, comboResponse).draft?.title).toBe("계란찜과 밥");
  });
  test("레시피 항목에는 AI가 덧붙인 설명을 남기지 않는다", () => {
    const rewritten = {
      ...comboResponse,
      draft: {
        ...comboResponse.draft,
        items: [
          { type: "recipe", recipeid: RECIPE_ID, title: "계란찜", summary: "AI가 쓴 설명" },
          comboResponse.draft.items[1],
        ],
      },
    };
    const result = finalizeWritingResponse(comboRequest, rewritten);
    expect(result.kind === "combo" ? result.draft?.items[0] : null).toEqual({
      type: "recipe",
      recipeid: RECIPE_ID,
      title: "계란찜",
    });
  });
  test("서버 안내가 없는 응답은 빈 안내 목록으로 읽는다", () => {
    expect(finalizeWritingResponse(request, response).notices).toEqual([]);
  });
});

describe("모델 응답 목록 상한", () => {
  const list = (size: number) => Array.from({ length: size }, (_, index) => `항목 ${index + 1}`);
  const read = {
    suggestions: (result: WritingResponse) => result.suggestions,
    points: (result: WritingResponse) => result.outline.points,
    options: (result: WritingResponse) => result.question?.options,
  };
  test.each([
    ["제안 12개", "suggestions", { suggestions: list(12) }, 12],
    ["제안 13개", "suggestions", { suggestions: list(13) }, 12],
    ["구성 6개", "points", { outline: { title: "계란찜", points: list(6) } }, 5],
    ["선택지 5개", "options", { question: { ...response.question, options: list(5) } }, 4],
  ] as const)("안내 목록이 %s이면 앞에서부터 상한까지만 남긴다", (_label, field, patch, size) => {
    expect(read[field](writingResponseSchema.parse({ ...response, ...patch }))).toEqual(list(size));
  });
  test("저장할 태그는 상한을 넘으면 자르지 않고 거부한다", () => {
    const result = recipeDraftSchema.safeParse({ ...draft, tags: list(11) });
    expect(result.error?.issues[0]?.path).toEqual(["tags"]);
  });
});
