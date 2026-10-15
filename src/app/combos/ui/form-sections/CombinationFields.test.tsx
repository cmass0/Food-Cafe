// @vitest-environment jsdom
import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useFieldArray, useForm, type UseFormReturn } from "react-hook-form";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Form } from "@/components/ui/form";
import type { ComboFormValues } from "@/domain/combo/types";
import CombinationFields from "./CombinationFields";

const RECIPE_ID = "00000000-0000-4000-8000-000000000001";
let root: Root | undefined;
let container: HTMLDivElement;
let form: UseFormReturn<ComboFormValues>;

function Harness({ reference }: { reference: string }) {
  const methods = useForm<ComboFormValues>({
    defaultValues: { items: [{ type: "recipe", recipeid: reference }] },
  });
  useEffect(() => {
    form = methods;
  }, [methods]);
  const itemsArray = useFieldArray({ control: methods.control, name: "items" });
  return (
    <Form {...methods}>
      <CombinationFields form={methods} itemsArray={itemsArray} />
    </Form>
  );
}

async function mount(reference: string) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(<Harness reference={reference} />));
}

function input() {
  return container.querySelector<HTMLInputElement>('[aria-label="조합 항목 1 레시피 ID"]')!;
}

async function load() {
  const button = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "레시피 가져오기"
  )!;
  await act(async () => button.click());
}

async function edit(reference: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
      input(),
      reference
    );
    input().dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function reply(status: number) {
  return new Response(
    JSON.stringify(
      status === 200
        ? {
            data: {
              id: RECIPE_ID,
              title: "김치볶음밥",
              summary: "간단한 한 끼",
              chefTip: null,
              steps: [],
              ingredients: [],
              image: "/recipe.png",
              images: [],
              category: "한식",
              tags: [],
              tools: [],
              toolsRequired: false,
              difficulty: "쉬움",
              timeMinutes: 10,
              servings: 1,
              likeCount: 0,
              commentCount: 0,
              viewCount: 0,
              writerUid: null,
              writerName: null,
              lastLikedAt: null,
              createdAt: "2026-10-14",
              updatedAt: "2026-10-14",
              bookmarkCount: 0,
            },
          }
        : { message: "Internal server error" }
    ),
    { status }
  );
}

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  container?.remove();
  vi.unstubAllGlobals();
});

describe("조합 레시피 불러오기 안내", () => {
  test.each([
    ["빈 입력", "", "레시피 ID 또는 링크를 입력해 주세요."],
    ["잘못된 ID", "틀린아이디", "올바른 레시피 ID 또는 링크를 입력해 주세요."],
  ] as const)("%s은 조회하지 않고 한글 오류를 표시한다", async (_label, reference, message) => {
    const fetcher = vi.fn(async () => reply(200));
    vi.stubGlobal("fetch", fetcher);
    await mount(reference);
    await load();
    expect(container.textContent).toContain(message);
    expect(input().getAttribute("aria-invalid")).toBe("true");
    expect(fetcher).not.toHaveBeenCalled();
  });

  test("존재하지 않는 레시피는 ID 입력칸 아래에 한글로 안내한다", async () => {
    vi.stubGlobal("fetch", async () => reply(404));
    await mount(RECIPE_ID);
    await load();
    expect(container.textContent).toContain("레시피를 찾을 수 없어요. ID를 다시 확인해 주세요.");
    expect(input().getAttribute("aria-invalid")).toBe("true");
  });

  test.each(["서버 오류", "연결 실패"] as const)(
    "%s는 서버 원문 대신 재시도 안내를 표시한다",
    async (failure) => {
      vi.stubGlobal("fetch", async () => {
        if (failure === "연결 실패") throw new TypeError("Failed to fetch");
        return reply(500);
      });
      await mount(RECIPE_ID);
      await load();
      expect(container.textContent).toContain(
        "레시피를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
      );
      expect(container.textContent).not.toContain("Internal server error");
    }
  );

  test("오류 후 성공하면 안내를 지우고 레시피 정보를 채운다", async () => {
    vi.stubGlobal("fetch", async () => reply(404));
    await mount(RECIPE_ID);
    await load();
    vi.stubGlobal("fetch", async () => reply(200));
    await load();
    expect(container.textContent).not.toContain("레시피를 찾을 수 없어요.");
    expect(form.getValues("items.0.title")).toBe("김치볶음밥");
    expect(input().getAttribute("aria-invalid")).toBe("false");
  });

  test("다른 ID를 입력하면 이전 레시피 정보와 조회 오류를 지운다", async () => {
    vi.stubGlobal("fetch", async () => reply(200));
    await mount(RECIPE_ID);
    await load();
    await edit("새로 입력한 잘못된 ID");
    expect(form.getValues("items.0.title")).toBeUndefined();
    expect(container.textContent).not.toContain("김치볶음밥");
    await load();
    await edit(RECIPE_ID);
    expect(input().getAttribute("aria-invalid")).toBe("false");
  });

  test("쿼리와 해시가 포함된 레시피 링크에서 ID를 추출해 불러온다", async () => {
    let requested = "";
    vi.stubGlobal("fetch", async (url: string) => {
      requested = url;
      return reply(200);
    });
    await mount(`https://food.example/recipes/${RECIPE_ID}?from=combo#steps`);
    await load();
    expect(requested).toBe(`/api/recipes/${RECIPE_ID}`);
    expect(input().value).toBe(RECIPE_ID);
    expect(form.getValues("items.0.summary")).toBe("간단한 한 끼");
  });

  test("입력을 바꾼 뒤 도착한 이전 조회 결과는 현재 항목에 반영하지 않는다", async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        })
    );
    await mount(RECIPE_ID);
    await load();
    await edit("다른 잘못된 ID");
    await act(async () => resolve(reply(200)));
    expect(input().value).toBe("다른 잘못된 ID");
    expect(form.getValues("items.0.title")).toBeUndefined();
  });
});
