import { format } from "node:util";
import { afterEach, describe, expect, test, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { MAX_CALLS_PER_SESSION, WRITING_LIMIT_MESSAGES } from "@/features/writing-assistant/limits";
import { unavailableRecipesNotice } from "@/features/writing-assistant/selected-recipes";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({
  getUser: vi.fn(),
  model: vi.fn(),
  rpc: vi.fn(),
  recipeRows: [] as Record<string, unknown>[],
}));
// Auth·DB 네트워크와 유료 모델만 대체하고 Route → 검증 → 서비스 → SDK 연결을 실행한다.
vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: async () => ({
    auth: { getUser: boundary.getUser },
    from: () => ({
      select: () => ({
        in: async (_column: string, ids: string[]) => ({
          data: boundary.recipeRows.filter((row) => ids.includes(row.id as string)),
          error: null,
        }),
      }),
    }),
  }),
}));
vi.mock("@/lib/ai/model", () => ({ getRecommendLanguageModel: boundary.model }));
// 사용 횟수 RPC는 서버 전용(service_role)이다. 실제 상한·동시성은 pgTAP(rpc/writing_assistant_sessions)이 검증한다.
vi.mock("@/lib/supabase/admin", () => ({ getAdminSupabase: () => ({ rpc: boundary.rpc }) }));
const SESSION_ID = "00000000-0000-4000-8000-0000000000aa";
const input = {
  sessionId: SESSION_ID,
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
});
function request(body: unknown = input) {
  return new Request("http://localhost/api/writing-assistant", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
function login() {
  boundary.getUser.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
  // 기본은 이 대화에서 호출할 수 있는 상태(호출 수 1이 된다)다.
  boundary.rpc.mockResolvedValue({ data: 1, error: null });
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
    expect(boundary.rpc).toHaveBeenCalledTimes(1);
    expect(boundary.rpc).toHaveBeenCalledWith("use_writing_assistant_call", {
      p_session_id: SESSION_ID,
      p_user_id: "user",
      p_max_calls: MAX_CALLS_PER_SESSION,
    });
  });
  test("대화의 호출 상한을 넘었거나 남의 대화면 모델을 부르지 않고 429로 안내한다", async () => {
    login();
    boundary.rpc.mockResolvedValue({ data: null, error: null });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect((await response.json()).message).toBe(WRITING_LIMIT_MESSAGES.session);
    expect(boundary.model).not.toHaveBeenCalled();
  });
  test("모델이 실패하면 그 호출을 사용 횟수에서 되돌린다", async () => {
    login();
    boundary.model.mockReturnValue(modelReply({ secret: "외부 제공사 원문" }));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      expect((await POST(request())).status).toBe(500);
      expect(boundary.rpc).toHaveBeenLastCalledWith("refund_writing_assistant_call", {
        p_session_id: SESSION_ID,
        p_user_id: "user",
      });
    } finally {
      log.mockRestore();
    }
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
