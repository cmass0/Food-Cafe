// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WritingAssistantWorkspace } from "@/components/writing-assistant/WritingAssistantWorkspace";
import type { ComboFormValues } from "@/domain/combo/types";
import ComboForm from "./ComboForm";

const RECIPE_ID = "00000000-0000-4000-8000-000000000001";
const router = {
  back() {},
  forward() {},
  push() {},
  replace() {},
  prefetch() {},
  refresh() {},
  bfcacheId: "test",
};

function comboResponse(items: unknown[]) {
  return {
    kind: "combo",
    outline: { title: "컵라면과 밥", points: ["상품 두 개"] },
    question: null,
    suggestions: ["시간은 추정입니다."],
    draft: {
      title: "컵라면과 밥",
      summary: "든든한 한 끼",
      difficulty: "쉬움",
      time_minutes: 5,
      tags: ["편의점"],
      tools: ["전기포트"],
      steps: [{ description: "포장지 조리법대로 준비해 함께 먹는다." }],
      items,
    },
  };
}

// AI 응답은 네트워크 경계에서 대체하고, 도우미가 보낸 요청을 돌려준다.
// 응답을 여러 개 주면 요청마다 차례로 쓰고, 마지막 응답을 계속 쓴다.
function stubBrowser(...aiResponses: unknown[]) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  );
  const sent = { formContext: "", recipeIds: [] as string[][] };
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    const body = JSON.parse(init.body as string);
    sent.formContext = body.formContext;
    sent.recipeIds.push(body.recipeIds);
    const reply = aiResponses[Math.min(sent.recipeIds.length, aiResponses.length) - 1];
    return new Response(JSON.stringify(reply));
  });
  return sent;
}

function questionResponse() {
  return {
    kind: "combo",
    outline: { title: "볶음밥 한 끼", points: ["볶음밥"] },
    question: { topic: "곁들임", text: "무엇을 곁들일까요?", options: [] },
    draft: null,
    suggestions: [],
  };
}

async function renderForm(initial: Partial<ComboFormValues>) {
  const submit = vi.fn();
  const element = document.createElement("div");
  document.body.append(element);
  const root = createRoot(element);
  await act(async () =>
    root.render(
      <AppRouterContext.Provider value={router}>
        <WritingAssistantWorkspace kind="combo">
          <ComboForm mode="edit" cancelHref="/combos" onSubmit={submit} defaultValues={initial} />
        </WritingAssistantWorkspace>
      </AppRouterContext.Provider>
    )
  );
  return {
    element,
    submit,
    async cleanup() {
      await act(async () => root.unmount());
      element.remove();
    },
  };
}

async function click(label: string) {
  const button = Array.from(document.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === label
  );
  if (!button) throw new Error(`버튼 없음: ${label}`);
  await act(async () => button.click());
}

afterEach(() => vi.unstubAllGlobals());

test("조합 초안을 반영해도 기존 대표·상품 이미지는 유지한다", async () => {
  const sent = stubBrowser(
    comboResponse([
      { type: "product", productName: "컵라면", summary: "따뜻하게" },
      { type: "product", productName: "즉석밥", summary: "" },
    ])
  );
  const { element, submit, cleanup } = await renderForm({
    title: "직접 적은 조합",
    image: "https://example.com/main.jpg",
    items: [
      {
        type: "product" as const,
        productName: "컵라면",
        summary: "원래 설명",
        image: "https://example.com/product.jpg",
      },
    ],
  });
  try {
    const createUrl = vi.fn(() => "blob:product-upload");
    vi.stubGlobal(
      "URL",
      class extends URL {
        static createObjectURL = createUrl;
        static revokeObjectURL = vi.fn();
      }
    );
    const upload = element.querySelector<HTMLInputElement>('[aria-label="상품 1 이미지"]')!;
    Object.defineProperty(upload, "files", {
      value: [new File(["image"], "product.png", { type: "image/png" })],
    });
    await act(async () => upload.dispatchEvent(new Event("change", { bubbles: true })));
    await click("아이디어 없이 시작");
    expect(sent.formContext).toContain("직접 적은 조합");
    expect(sent.formContext).not.toContain(".jpg");
    await click("폼에 반영하기");
    await click("확인");
    expect(element.querySelector<HTMLInputElement>('input[name="title"]')?.value).toBe(
      "컵라면과 밥"
    );
    expect(
      element.querySelector<HTMLInputElement>('input[name="items.0.productName"]')?.value
    ).toBe("컵라면");
    expect(
      element.querySelector<HTMLInputElement>('input[name="items.1.productName"]')?.value
    ).toBe("즉석밥");
    const images = Array.from(element.querySelectorAll("img"))
      .map((image) => image.getAttribute("src"))
      .join(" ");
    expect(images).toContain("main.jpg");
    expect(images).toContain("blob:product-upload");
    expect(submit).not.toHaveBeenCalled();
  } finally {
    await cleanup();
  }
});

test("레시피 항목은 AI가 쓴 이름·설명 대신 폼에 불러온 레시피 정보로 저장한다", async () => {
  const recipe = {
    type: "recipe" as const,
    recipeid: RECIPE_ID,
    title: "김치볶음밥",
    summary: "원래 레시피 설명",
    image: "https://example.com/recipe.jpg",
  };
  stubBrowser(
    comboResponse([
      { type: "recipe", recipeid: RECIPE_ID, title: "매콤 김치볶음밥", summary: "AI가 쓴 설명" },
      { type: "product", productName: "단무지", summary: "곁들임" },
    ])
  );
  const { submit, cleanup } = await renderForm({
    title: "직접 적은 조합",
    image: "https://example.com/main.jpg",
    items: [recipe, { type: "product" as const, productName: "계란국", summary: "", image: null }],
  });
  try {
    await click("아이디어 없이 시작");
    await click("폼에 반영하기");
    await click("확인");
    await click("수정");
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0]?.[0].items[0]).toEqual(recipe);
  } finally {
    await cleanup();
  }
});

test("대화 중 폼에서 지운 레시피는 다음 질문부터 AI에 보내지 않는다", async () => {
  const sent = stubBrowser(questionResponse());
  const { element, cleanup } = await renderForm({
    title: "직접 적은 조합",
    image: "https://example.com/main.jpg",
    items: [
      { type: "recipe" as const, recipeid: RECIPE_ID, title: "김치볶음밥" },
      { type: "product" as const, productName: "단무지", summary: "" },
    ],
  });
  try {
    await click("아이디어 없이 시작");
    await click("삭제");
    expect(element.querySelector('[aria-label="조합 항목 1 레시피 ID"]')).toBeNull();
    await click("AI에게 맡기기");
    expect(sent.recipeIds).toEqual([[RECIPE_ID], []]);
  } finally {
    await cleanup();
  }
});

test("답을 받은 뒤 폼에서 지운 레시피는 반영 확인창에 알리고 다시 넣는다", async () => {
  stubBrowser(
    comboResponse([
      { type: "recipe", recipeid: RECIPE_ID, title: "김치볶음밥" },
      { type: "product", productName: "단무지", summary: "" },
    ])
  );
  const { element, submit, cleanup } = await renderForm({
    title: "직접 적은 조합",
    image: "https://example.com/main.jpg",
    items: [
      { type: "recipe" as const, recipeid: RECIPE_ID, title: "김치볶음밥" },
      { type: "product" as const, productName: "단무지", summary: "", image: null },
    ],
  });
  try {
    await click("아이디어 없이 시작");
    await click("삭제");
    expect(element.querySelector('[aria-label="조합 항목 1 레시피 ID"]')).toBeNull();
    await click("폼에 반영하기");
    const notice = document.querySelector('[aria-label="반영하면 다시 넣는 레시피"]');
    expect(notice?.textContent).toContain("김치볶음밥");
    await click("확인");
    await click("수정");
    expect(submit.mock.calls[0]?.[0].items[0]).toMatchObject({
      type: "recipe",
      recipeid: RECIPE_ID,
      title: "김치볶음밥",
    });
  } finally {
    await cleanup();
  }
});

test("초안에 없는 레시피는 폼에 남기고, 빠지는 상품은 반영 확인창에 알린다", async () => {
  const recipe = {
    type: "recipe" as const,
    recipeid: RECIPE_ID,
    title: "김치볶음밥",
    summary: "원래 레시피 설명",
    image: "https://example.com/recipe.jpg",
  };
  stubBrowser(
    comboResponse([
      { type: "product", productName: "신라면", summary: "" },
      { type: "product", productName: "단무지", summary: "" },
    ])
  );
  const { submit, cleanup } = await renderForm({
    title: "직접 적은 조합",
    image: "https://example.com/main.jpg",
    items: [
      recipe,
      {
        type: "product" as const,
        productName: "신라면 컵",
        summary: "",
        image: "https://example.com/cup.jpg",
      },
    ],
  });
  try {
    await click("아이디어 없이 시작");
    await click("폼에 반영하기");
    const warning = document.querySelector('[aria-label="반영하면 빠지는 항목"]');
    expect(warning?.textContent).toContain("신라면 컵 (사진 포함)");
    await click("확인");
    await click("수정");
    expect(submit.mock.calls[0]?.[0].items).toEqual([
      { type: "product", productName: "신라면", summary: "" },
      { type: "product", productName: "단무지", summary: "" },
      recipe,
    ]);
  } finally {
    await cleanup();
  }
});
