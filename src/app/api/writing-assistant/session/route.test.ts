import { afterEach, describe, expect, test, vi } from "vitest";
import { MAX_DAILY_SESSIONS, WRITING_LIMIT_MESSAGES } from "@/features/writing-assistant/limits";
import { GET, POST } from "./route";

vi.mock("server-only", () => ({}));
const boundary = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
// Auth 네트워크와 서버 전용 RPC만 대체한다. 실제 하루 상한·동시성은 pgTAP(rpc/writing_assistant_sessions)이 검증한다.
vi.mock("@/lib/supabase/server", () => ({
  getServerSupabase: async () => ({ auth: { getUser: boundary.getUser } }),
}));
vi.mock("@/lib/supabase/admin", () => ({ getAdminSupabase: () => ({ rpc: boundary.rpc }) }));

const SESSION_ID = "00000000-0000-4000-8000-0000000000bb";

function login() {
  boundary.getUser.mockResolvedValue({ data: { user: { id: "user" } }, error: null });
}
function rpcReturns(values: Record<string, unknown>) {
  boundary.rpc.mockImplementation(async (name: string) => ({ data: values[name], error: null }));
}

afterEach(() => {
  vi.resetAllMocks();
});

describe("작성 도우미 시작 API", () => {
  test.each([
    ["남은 횟수 조회", GET],
    ["시작", POST],
  ] as const)("비로그인 요청은 %s를 하지 않고 401을 반환한다", async (_label, handler) => {
    boundary.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await handler()).status).toBe(401);
    expect(boundary.rpc).not.toHaveBeenCalled();
  });

  test("남은 횟수는 하루 상한에서 오늘 시작한 대화 수를 뺀 값이다", async () => {
    login();
    rpcReturns({ count_writing_assistant_sessions_today: 1 });
    const response = await GET();
    expect(await response.json()).toEqual({
      remaining: MAX_DAILY_SESSIONS - 1,
      limit: MAX_DAILY_SESSIONS,
    });
    expect(boundary.rpc).toHaveBeenCalledWith("count_writing_assistant_sessions_today", {
      p_user_id: "user",
    });
  });

  test("오늘 횟수가 남았으면 서버 세션의 사용자로 새 대화를 만들고 대화 ID와 남은 횟수를 돌려준다", async () => {
    login();
    rpcReturns({
      start_writing_assistant_session: SESSION_ID,
      count_writing_assistant_sessions_today: 1,
    });
    const response = await POST();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sessionId: SESSION_ID,
      remaining: MAX_DAILY_SESSIONS - 1,
      limit: MAX_DAILY_SESSIONS,
    });
    expect(boundary.rpc).toHaveBeenCalledWith("start_writing_assistant_session", {
      p_user_id: "user",
      p_max_sessions: MAX_DAILY_SESSIONS,
    });
  });

  test("오늘 횟수를 다 썼으면 429와 한글 안내를 돌려준다", async () => {
    login();
    rpcReturns({ start_writing_assistant_session: null });
    const response = await POST();
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      message: WRITING_LIMIT_MESSAGES.daily,
      remaining: 0,
    });
  });

  test("서버 전용 RPC의 DB 오류 내용은 응답에 싣지 않는다", async () => {
    login();
    boundary.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "42883",
        message: "function public.start_writing_assistant_session does not exist",
        details: "",
        hint: "",
      },
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      const response = await POST();
      expect(response.status).toBe(500);
      expect(await response.text()).not.toContain("start_writing_assistant_session");
    } finally {
      log.mockRestore();
    }
  });
});
