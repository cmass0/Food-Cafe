// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { WritingAssistantWorkspace } from "@/components/writing-assistant/WritingAssistantWorkspace";
import RecipeForm from "./RecipeForm";

afterEach(() => vi.unstubAllGlobals());

test("AI 반영 확인 후 텍스트만 바꾸고 이미지는 보존하며 자동 저장하지 않는다", async () => {
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
  let sentContext = "";
  vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
    sentContext = JSON.parse(init.body as string).formContext;
    return new Response(
      JSON.stringify({
        kind: "recipe",
        outline: { title: "계란찜", points: ["계란"] },
        question: null,
        suggestions: ["분량은 제안입니다."],
        draft: {
          title: "AI 계란찜",
          summary: "부드러운 한 끼",
          chef_tip: "뜨거운 그릇 주의",
          category: "한식",
          difficulty: "쉬움",
          time_minutes: 10,
          servings: 2,
          ingredients: [{ name: "계란", amount: "3", unit: "개", unitCustom: "" }],
          steps: [{ description: "충분히 익힌다." }],
          tags: ["간단"],
          tools: ["전자레인지"],
        },
      })
    );
  });
  const element = document.createElement("div");
  document.body.append(element);
  const root = createRoot(element);
  const submit = vi.fn();
  const router = {
    back() {},
    forward() {},
    push() {},
    replace() {},
    prefetch() {},
    refresh() {},
    bfcacheId: "test",
  };
  async function click(label: string) {
    const button = Array.from(document.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === label
    );
    if (!button) throw new Error(`버튼 없음: ${label}`);
    await act(async () => button.click());
  }
  try {
    await act(async () =>
      root.render(
        <AppRouterContext.Provider value={router}>
          <WritingAssistantWorkspace kind="recipe">
            <RecipeForm
              mode="edit"
              cancelHref="/recipes"
              onSubmit={submit}
              defaultValues={{ title: "직접 쓴 제목", image: "https://example.com/original.jpg" }}
            />
          </WritingAssistantWorkspace>
        </AppRouterContext.Provider>
      )
    );
    await click("아이디어 없이 시작");
    expect(sentContext).toContain("직접 쓴 제목");
    expect(sentContext).not.toContain("original.jpg");
    await click("폼에 반영하기");
    expect(element.querySelector<HTMLInputElement>('input[name="title"]')?.value).toBe(
      "직접 쓴 제목"
    );
    await click("확인하고 반영");
    expect(element.querySelector<HTMLInputElement>('input[name="title"]')?.value).toBe("AI 계란찜");
    expect(element.querySelector<HTMLInputElement>('input[name="ingredients.0.name"]')?.value).toBe(
      "계란"
    );
    expect(element.querySelector("img")?.getAttribute("src")).toContain("original.jpg");
    expect(submit).not.toHaveBeenCalled();
  } finally {
    await act(async () => root.unmount());
    element.remove();
  }
});
