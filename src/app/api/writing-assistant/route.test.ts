import { afterEach, describe, expect, test, vi } from "vitest";
import { MockLanguageModelV4 } from "ai/test";
import { POST } from "./route";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ getUser: vi.fn(), model: vi.fn() }));
// Auth 네트워크와 유료 모델만 대체하고 Route → 검증 → 서비스 → SDK 연결을 실행한다.
vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: async () => ({ auth: { getUser: boundary.getUser } }),
}));
vi.mock("@/lib/ai/model", () => ({ getRecommendLanguageModel: boundary.model }));
const input = {
  kind: "recipe",
  memo: "두부가 있어",
  formContext: "{}",
  recipeReferences: [],
  turns: [],
  outline: null,
  finish: false,
};

afterEach(() => {
  vi.resetAllMocks();
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
function modelReply(value: unknown) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text: JSON.stringify(value) }],
      finishReason: { unified: "stop", raw: undefined },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 1, text: 1, reasoning: undefined },
      },
      warnings: [],
    }),
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
});
