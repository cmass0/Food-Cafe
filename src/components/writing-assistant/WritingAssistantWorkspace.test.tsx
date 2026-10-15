// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WritingAssistantWorkspace } from "./WritingAssistantWorkspace";
import type { WritingAssistantKind } from "./types";
import type { WritingRequest } from "@/features/writing-assistant/types";
import { WRITING_LIMIT_MESSAGES } from "@/features/writing-assistant/limits";

const SESSION_ID = "00000000-0000-4000-8000-0000000000aa";

function reply(request: WritingRequest) {
  const finished = request.finish || request.turns.length >= 5;
  const basic = {
    title: "새로 생성한 초안",
    summary: "간단한 한 끼",
    difficulty: "쉬움",
    time_minutes: 10,
    tags: [],
    tools: [],
    steps: [{ description: "충분히 익혀 함께 먹는다." }],
  };
  return {
    kind: request.kind,
    outline: { title: "새로 생성한 초안", points: ["계란", "전자레인지"] },
    question: finished
      ? null
      : {
          topic: "맛",
          text: `선호하는 맛 ${request.turns.length + 1}?`,
          options: ["담백하게", "알아서"],
        },
    suggestions: ["시간은 AI 제안입니다."],
    draft: !finished
      ? null
      : request.kind === "recipe"
        ? {
            ...basic,
            chef_tip: "뜨거운 그릇 주의",
            category: "한식",
            servings: 1,
            ingredients: [{ name: "계란", amount: "2", unit: "개", unitCustom: "" }],
          }
        : {
            ...basic,
            items: [
              { type: "product", productName: "컵라면", summary: "" },
              { type: "product", productName: "즉석밥", summary: "" },
            ],
          },
  };
}

// 시작 API(/session)는 오늘 남은 횟수와 대화 ID를, 도우미 API는 다음 질문·초안을 돌려준다.
function connectResponses({ remaining = 2 }: { remaining?: number } = {}) {
  const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith("/api/writing-assistant/session")) {
      if (init?.method !== "POST") return new Response(JSON.stringify({ remaining, limit: 2 }));
      if (remaining === 0) return new Response(JSON.stringify({ remaining: 0 }), { status: 429 });
      return new Response(
        JSON.stringify({ sessionId: SESSION_ID, remaining: remaining - 1, limit: 2 })
      );
    }
    return new Response(JSON.stringify(reply(JSON.parse(init!.body as string))), { status: 200 });
  });
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

let root: Root | undefined;
let container: HTMLDivElement;

async function mount(kind: WritingAssistantKind = "recipe", usage?: { remaining: number }) {
  const fetcher = connectResponses(usage);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
  const router: AppRouterInstance = {
    back() {},
    forward() {},
    push() {},
    replace() {},
    prefetch() {},
    refresh() {},
    bfcacheId: "test",
  };
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root!.render(
      <AppRouterContext.Provider value={router}>
        <WritingAssistantWorkspace kind={kind}>
          <form onSubmit={submit}>
            <input aria-label="작성 중인 제목" defaultValue="직접 작성한 제목" />
            <button type="submit">레시피 등록</button>
          </form>
        </WritingAssistantWorkspace>
      </AppRouterContext.Provider>
    )
  );
  await flush();
  return { submit, fetcher };
}

// 남은 횟수 조회처럼 화면 밖에서 끝나는 요청을 기다린다.
async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

// "작성 도우미 시작하기" → 확인창 "시작하기". 하루 사용 1번을 쓴다.
async function activate() {
  await click("작성 도우미 시작하기");
  await click("시작하기", document);
  await flush();
}

function panel() {
  return container.querySelector("aside")!;
}

async function click(label: string, scope: ParentNode = panel()) {
  const button = Array.from(scope.querySelectorAll("button")).find(
    (item) => (item.getAttribute("aria-label") ?? item.textContent?.trim()) === label
  );
  if (!button) throw new Error(`버튼을 찾지 못했습니다: ${label}`);
  await act(async () => button.click());
}

async function typeAnswer(text: string) {
  const textarea = panel().querySelector("textarea")!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(
      textarea,
      text
    );
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  vi.unstubAllGlobals();
});

describe("작성 도우미 대화", () => {
  test.each(["recipe", "combo"] as const)(
    "%s는 다섯 번째 응답 뒤 질문을 끝내고 초안을 보여준다",
    async (kind) => {
      const { submit } = await mount(kind);
      await activate();
      await click("아이디어 없이 시작");
      const outline = panel().querySelector('[aria-label="현재 초안 구성"]')!.textContent;
      for (let index = 1; index <= 5; index++) {
        expect(panel().querySelector('[aria-label="현재 질문"]')?.textContent).toContain(
          `질문 ${index}`
        );
        await click("AI에게 맡기기");
      }
      expect(panel().querySelector('[aria-label="현재 질문"]')).toBeNull();
      expect(panel().querySelector("textarea")).toBeNull();
      expect(panel().querySelector('[aria-label="초안 미리보기"]')).not.toBeNull();
      expect(panel().querySelector('[aria-label="현재 초안 구성"]')!.textContent).toBe(outline);
      expect(panel().textContent).toContain("답변 5개");
      const apply = Array.from(panel().querySelectorAll("button")).find(
        (button) => button.textContent === "폼에 반영하기"
      );
      expect(apply?.disabled).toBe(false);
      expect(submit).not.toHaveBeenCalled();
    }
  );

  test("자유 답변을 서버에 전달하고 서버가 반환한 다음 질문을 표시한다", async () => {
    await mount();
    await activate();
    await click("아이디어 없이 시작");
    const outline = panel().querySelector('[aria-label="현재 초안 구성"]')!.textContent;
    await typeAnswer("ㅋㅋ 바나나 우주선");
    await click("답변 보내기");
    expect(panel().textContent).toContain("ㅋㅋ 바나나 우주선");
    expect(panel().querySelector('[aria-label="현재 질문"]')?.textContent).toContain("질문 2");
    expect(panel().querySelector('[aria-label="현재 초안 구성"]')!.textContent).toBe(outline);
    expect(panel().querySelector("textarea")!.value).toBe("");
    expect(panel().querySelector('[aria-label="현재 질문"]')?.textContent).toContain(
      "선호하는 맛 2?"
    );
  });

  test("중간에 초안을 보면 아직 보내지 않은 답변도 기록하고 질문을 종료한다", async () => {
    await mount();
    await activate();
    await click("아이디어 없이 시작");
    await typeAnswer("담백하게 먹고 싶어요");
    await click("여기까지 초안 보기");
    expect(panel().querySelector('[aria-label="초안 미리보기"]')).not.toBeNull();
    expect(panel().textContent).toContain("담백하게 먹고 싶어요");
    expect(panel().textContent).toContain("답변 1개");
  });

  test("도우미를 다시 시작해도 형제 폼의 입력을 보존하고 제출하지 않는다", async () => {
    const { submit } = await mount();
    await activate();
    const title = container.querySelector<HTMLInputElement>('[aria-label="작성 중인 제목"]')!;
    title.value = "수정 중인 레시피";
    await click("아이디어 없이 시작");
    await click("AI에게 맡기기");
    await click("도우미 다시 시작");
    expect(panel().querySelector('[aria-label="현재 초안 구성"]')).toBeNull();
    expect(panel().querySelector("textarea")!.value).toBe("");
    expect(title.value).toBe("수정 중인 레시피");
    expect(submit).not.toHaveBeenCalled();
  });

  test("모바일 패널을 닫았다 열어도 질문과 입력 중인 답변이 유지된다", async () => {
    await mount();
    await activate();
    await click("아이디어 없이 시작");
    await click("AI에게 맡기기");
    await typeAnswer("작성 중인 답변");
    const trigger = container.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!;
    await act(async () => trigger.click());
    let dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain("질문 2");
    expect(dialog.querySelector("textarea")!.value).toBe("작성 중인 답변");
    await click("작성 도우미 닫기", dialog);
    await act(async () => trigger.click());
    dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain("질문 2");
    expect(dialog.querySelector("textarea")!.value).toBe("작성 중인 답변");
  });

  test("실패한 답변은 횟수를 늘리지 않고 입력을 보존하며 재시도한다", async () => {
    await mount();
    await activate();
    await click("아이디어 없이 시작");
    await typeAnswer("계란은 빼주세요");
    vi.stubGlobal("fetch", async () => new Response("error", { status: 503 }));
    await click("답변 보내기");
    expect(panel().querySelector('[role="alert"]')?.textContent).toContain("다시 시도");
    expect(panel().querySelector("textarea")!.value).toBe("계란은 빼주세요");
    expect(panel().querySelector('[aria-label="현재 질문"]')?.textContent).toContain("질문 1");
    connectResponses();
    await click("다시 시도");
    expect(panel().querySelector('[aria-label="현재 질문"]')?.textContent).toContain("질문 2");
    expect(panel().textContent).toContain("답변 1개");
  });

  test("생성 중 다시 시작하면 뒤늦게 도착한 응답을 버린다", async () => {
    await mount();
    await activate();
    await click("아이디어 없이 시작");
    let resolve!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        })
    );
    await click("AI에게 맡기기");
    await click("도우미 다시 시작");
    await act(async () =>
      resolve(
        new Response(
          JSON.stringify(
            reply({ kind: "recipe", turns: [], finish: false } as unknown as WritingRequest)
          )
        )
      )
    );
    expect(panel().querySelector('[aria-label="현재 질문"]')).toBeNull();
    expect(panel().querySelector("textarea")!.value).toBe("");
  });
});

describe("작성 도우미 시작과 하루 사용 횟수", () => {
  test("시작하기 전에는 입력칸 대신 시작 버튼과 오늘 남은 횟수를 보여준다", async () => {
    await mount();
    expect(panel().querySelector("textarea")).toBeNull();
    expect(panel().textContent).toContain("작성 도우미 시작하기");
    expect(panel().textContent).toContain("오늘 남은 횟수 2/2");
  });

  test("시작을 확인하면 대화 ID를 받아 입력칸을 열고, 그 뒤 요청마다 대화 ID를 보낸다", async () => {
    const { fetcher } = await mount();
    await activate();
    expect(panel().querySelector("textarea")).not.toBeNull();
    expect(panel().textContent).not.toContain("작성 도우미 시작하기");
    await click("아이디어 없이 시작");
    const turn = fetcher.mock.calls.find(([url]) => url === "/api/writing-assistant");
    expect(JSON.parse(turn![1]!.body as string).sessionId).toBe(SESSION_ID);
  });

  test("확인창에서 취소하면 오늘 횟수를 쓰지 않는다", async () => {
    const { fetcher } = await mount();
    await click("작성 도우미 시작하기");
    await click("취소", document);
    expect(fetcher.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
    expect(panel().querySelector("textarea")).toBeNull();
  });

  test("오늘 횟수를 다 썼으면 시작 대신 안내 창을 띄운다", async () => {
    await mount("recipe", { remaining: 1 });
    vi.stubGlobal(
      "fetch",
      async () => new Response(JSON.stringify({ remaining: 0 }), { status: 429 })
    );
    await activate();
    expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain(
      WRITING_LIMIT_MESSAGES.dailyTitle
    );
    expect(panel().querySelector("textarea")).toBeNull();
    expect(panel().textContent).toContain("오늘 남은 횟수 0/2");
  });

  test("남은 횟수가 0이면 서버에 묻지 않고 바로 안내 창을 띄운다", async () => {
    const { fetcher } = await mount("recipe", { remaining: 0 });
    await click("작성 도우미 시작하기");
    expect(document.querySelector('[role="alertdialog"]')?.textContent).toContain(
      WRITING_LIMIT_MESSAGES.daily
    );
    expect(fetcher.mock.calls.some(([, init]) => init?.method === "POST")).toBe(false);
  });
});
