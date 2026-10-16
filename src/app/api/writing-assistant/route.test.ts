import { format } from "node:util";
import { afterEach, describe, expect, test, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { unavailableRecipesNotice } from "@/features/writing-assistant/selected-recipes";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({
  getUser: vi.fn(),
  model: vi.fn(),
  recipeRows: [] as Record<string, unknown>[],
  recipeError: null as { message: string; code: string } | null,
}));
// Auth·DB 네트워크와 유료 모델만 대체하고 Route → 검증 → 서비스 → SDK 연결을 실행한다.
vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: async () => ({
    auth: { getUser: boundary.getUser },
    from: () => ({
      select: () => ({
        in: async (_column: string, ids: string[]) => ({
          data: boundary.recipeError
            ? null
            : boundary.recipeRows.filter((row) => ids.includes(row.id as string)),
          error: boundary.recipeError,
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/ai/model", () => ({ getRecommendLanguageModel: boundary.model }));
const input = {
  kind: "recipe",
  memo: "두부가 있어",
  formContext: "{}",
  recipeIds: [],
  turns: [],
  outline: null,
  finish: false,
};

afterEach(() => {
  vi.resetAllMocks();
  boundary.recipeRows = [];
  boundary.recipeError = null;
});
function request(body: unknown = input) {
  return new Request("http://localhost/api/writing-assistant", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
function login() {
  boundary.getUser.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
}
function modelReply(value: unknown, onPrompt?: (prompt: unknown) => void) {
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      onPrompt?.(options.prompt);
      return {
        content: [{ type: "text", text: JSON.stringify(value) }],
        finishReason: { unified: "stop", raw: undefined },
        usage: {
          inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
          outputTokens: { total: 1, text: 1, reasoning: undefined },
        },
        warnings: [],
      };
    },
  });
}
describe("작성 도우미 API 연결", () => {
  test("비로그인 요청은 모델을 부르지 않고 401을 반환한다", async () => {
    boundary.getUser.mockResolvedValue({ data: { user: null }, error: null });
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(boundary.model).not.toHaveBeenCalled();
  });
  test("잘못된 입력은 모델을 부르지 않고 400을 반환한다", async () => {
    login();
    expect((await POST(request({ ...input, memo: "x".repeat(2001) }))).status).toBe(400);
    expect(boundary.model).not.toHaveBeenCalled();
  });
  test("JSON이 아닌 입력은 400을 반환한다", async () => {
    login();
    expect(
      (
        await POST(
          new Request("http://localhost/api/writing-assistant", { method: "POST", body: "{" })
        )
      ).status
    ).toBe(400);
    expect(boundary.model).not.toHaveBeenCalled();
  });
  test("SDK에서 검증한 다음 질문을 캐시하지 않는 JSON으로 반환한다", async () => {
    login();
    boundary.model.mockReturnValue(
      modelReply({
        kind: "recipe",
        outline: { title: "두부부침", points: ["두부", "팬"] },
        question: { topic: "맛", text: "담백하게 먹을까요?", options: ["네"] },
        draft: null,
        suggestions: [],
      })
    );
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      question: { text: "담백하게 먹을까요?" },
      draft: null,
    });
  });
  test("조합은 고른 레시피를 DB에서 읽어 AI에 넘기고, AI가 빼도 초안에 남기며 못 읽은 레시피는 알린다", async () => {
    login();
    const rice = "00000000-0000-4000-8000-000000000001";
    const deleted = "00000000-0000-4000-8000-000000000002";
    boundary.recipeRows = [
      {
        id: rice,
        title: "김치볶음밥",
        summary: "매콤한 볶음밥",
        steps: [{ description: "밥과 김치를 센 불에 볶는다." }],
        ingredients: [{ name: "김치", amount: "1", unit: "컵" }],
        time_minutes: 15,
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      },
    ];
    let prompt = "";
    boundary.model.mockReturnValue(
      modelReply(
        {
          kind: "combo",
          outline: { title: "볶음밥 한 끼", points: ["볶음밥", "단무지"] },
          question: null,
          suggestions: [],
          draft: {
            title: "볶음밥 한 끼",
            summary: "",
            difficulty: "쉬움",
            time_minutes: 15,
            tags: [],
            tools: [],
            steps: [{ description: "볶음밥에 단무지를 곁들인다." }],
            items: [
              { type: "product", productName: "단무지", summary: "" },
              { type: "product", productName: "보리차", summary: "" },
            ],
          },
        },
        (value) => (prompt = JSON.stringify(value))
      )
    );
    const response = await POST(
      request({ ...input, kind: "combo", recipeIds: [rice, deleted], finish: true })
    );
    expect(response.status).toBe(200);
    expect(prompt).toContain("밥과 김치를 센 불에 볶는다.");
    const body = await response.json();
    expect(body.draft.items).toContainEqual({
      type: "recipe",
      recipeid: rice,
      title: "김치볶음밥",
    });
    expect(body.notices).toEqual([unavailableRecipesNotice(1)]);
  });
  test("같은 레시피를 대소문자만 다르게 두 번 보내도 AI에는 한 번만 넘기고 못 읽었다고 알리지 않는다", async () => {
    login();
    const rice = "f76c7a5f-8e6d-58aa-826a-5752329b215c";
    boundary.recipeRows = [
      {
        id: rice,
        title: "김치볶음밥",
        summary: null,
        steps: [{ description: "밥과 김치를 센 불에 볶는다." }],
        ingredients: [],
        created_at: "2026-10-01T00:00:00Z",
        updated_at: "2026-10-01T00:00:00Z",
      },
    ];
    let prompt = "";
    boundary.model.mockReturnValue(
      modelReply(
        {
          kind: "combo",
          outline: { title: "볶음밥 한 끼", points: ["볶음밥"] },
          question: { topic: "곁들임", text: "곁들일 것을 정할까요?", options: [] },
          suggestions: [],
          draft: null,
        },
        (value) => (prompt = JSON.stringify(value))
      )
    );
    const response = await POST(
      request({ ...input, kind: "combo", recipeIds: [rice.toUpperCase(), rice] })
    );
    expect(response.status).toBe(200);
    expect(prompt.split("밥과 김치를 센 불에 볶는다.")).toHaveLength(2);
    expect((await response.json()).notices).toEqual([]);
  });
  test("고른 레시피를 읽다 DB에 닿지 못하면 AI를 부르지 않고 503을 반환한다", async () => {
    login();
    boundary.recipeError = { message: "fetch failed", code: "" };
    const prompts: unknown[] = [];
    boundary.model.mockReturnValue(modelReply({}, (prompt) => prompts.push(prompt)));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await POST(
        request({
          ...input,
          kind: "combo",
          recipeIds: ["00000000-0000-4000-8000-000000000001"],
        })
      );
      expect(response.status).toBe(503);
      expect(prompts).toEqual([]);
    } finally {
      log.mockRestore();
    }
  });
  test("규격 밖 AI 응답은 초안으로 전달하지 않고 안전한 오류를 반환한다", async () => {
    login();
    boundary.model.mockReturnValue(modelReply({ secret: "외부 제공사 원문" }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await POST(request());
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain("외부 제공사 원문");
    } finally {
      log.mockRestore();
    }
  });
  test("모델 실패는 모델 원문 없이 오류 이름만 로그에 남긴다", async () => {
    login();
    boundary.model.mockReturnValue(modelReply({ secret: "외부 제공사 원문" }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      await POST(request());
      const printed = log.mock.calls.map((args) => format(...args)).join("\n");
      expect(printed).toContain("작성 도우미 생성 실패");
      expect(printed).not.toContain("외부 제공사 원문");
    } finally {
      log.mockRestore();
    }
  });
});
