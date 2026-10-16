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

function Harness({ items }: { items: ComboFormValues["items"] }) {
  const methods = useForm<ComboFormValues>({ defaultValues: { items } });
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

async function mountItems(items: ComboFormValues["items"]) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(<Harness items={items} />));
}

function mount(reference: string, title?: string) {
  return mountItems([{ type: "recipe", recipeid: reference, title }]);
}

function input(position = 1) {
  return container.querySelector<HTMLInputElement>(
    `[aria-label="조합 항목 ${position} 레시피 ID"]`
  )!;
}

async function load() {
  const button = Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent === "불러오기"
  )!;
  await act(async () => button.click());
}

async function edit(reference: string, position = 1) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
      input(position),
      reference
    );
    input(position).dispatchEvent(new Event("input", { bubbles: true }));
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
              image: null,
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

  // 불러오는 동안 불러오기 버튼은 잠기므로, 화면을 열 때의 자동 조회와 같은 주소 붙여 넣기가 겹치는 경우로 확인한다.
  test("같은 레시피를 연달아 불러오면 먼저 보낸 요청의 늦은 실패가 결과를 덮어쓰지 않는다", async () => {
    const pending: ((response: Response) => void)[] = [];
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>((done) => {
          pending.push(done);
        })
    );
    await mount(RECIPE_ID);
    await edit(`https://food.example/recipes/${RECIPE_ID}`);
    expect(pending).toHaveLength(2);
    await act(async () => pending[1]!(reply(200)));
    await act(async () => pending[0]!(reply(500)));
    expect(form.getValues("items.0.title")).toBe("김치볶음밥");
    expect(container.textContent).not.toContain("레시피를 불러오지 못했어요");
    expect(input().getAttribute("aria-invalid")).toBe("false");
  });
});

describe("조합 레시피 자동 불러오기", () => {
  test("레시피 주소를 붙여 넣으면 불러오기를 누르지 않아도 불러온다", async () => {
    vi.stubGlobal("fetch", async () => reply(200));
    await mount("");
    await edit(`https://food.example/recipes/${RECIPE_ID}`);
    expect(input().value).toBe(RECIPE_ID);
    expect(form.getValues("items.0.title")).toBe("김치볶음밥");
    expect(container.textContent).toContain("‘김치볶음밥’ 레시피를 불러왔어요");
  });

  test("대문자가 섞인 레시피 ID를 붙여 넣으면 소문자로 맞춰 불러온다", async () => {
    let requested = "";
    vi.stubGlobal("fetch", async (url: string) => {
      requested = url;
      return reply(200);
    });
    await mount("");
    await edit(RECIPE_ID.toUpperCase().replace("0000", "ABCD"));
    expect(input().value).toBe(RECIPE_ID.replace("0000", "abcd"));
    expect(requested).toBe(`/api/recipes/${RECIPE_ID.replace("0000", "abcd")}`);
  });

  test("형식이 맞지 않는 값을 치는 중에는 불러오지도 오류를 보이지도 않는다", async () => {
    const fetcher = vi.fn(async () => reply(200));
    vi.stubGlobal("fetch", fetcher);
    await mount("");
    await edit(RECIPE_ID.slice(0, 20));
    expect(fetcher).not.toHaveBeenCalled();
    expect(input().getAttribute("aria-invalid")).toBe("false");
  });

  test("불러오는 동안 진행 상태를 보여주고 끝나면 불러온 레시피 이름을 보여준다", async () => {
    let resolve!: (response: Response) => void;
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        })
    );
    await mount("");
    await edit(RECIPE_ID);
    expect(container.textContent).toContain("레시피를 불러오는 중이에요");
    await act(async () => resolve(reply(200)));
    expect(container.textContent).not.toContain("레시피를 불러오는 중이에요");
    expect(container.textContent).toContain("‘김치볶음밥’ 레시피를 불러왔어요");
  });

  test("불러온 레시피의 주소를 다시 붙여 넣으면 다시 조회하지 않고 ID로 바꿔 둔다", async () => {
    const fetcher = vi.fn(async () => reply(200));
    vi.stubGlobal("fetch", fetcher);
    await mount(RECIPE_ID, "김치볶음밥");
    fetcher.mockClear();
    await edit(`https://food.example/recipes/${RECIPE_ID}?from=list`);
    expect(input().value).toBe(RECIPE_ID);
    expect(fetcher).not.toHaveBeenCalled();
    expect(form.getValues("items.0.title")).toBe("김치볶음밥");
  });

  test("열 때 확인이 실패한 저장된 레시피는 같은 주소를 붙여 넣으면 다시 확인한다", async () => {
    vi.stubGlobal("fetch", async () => reply(500));
    await mount(RECIPE_ID, "김치볶음밥");
    const fetcher = vi.fn(async () => reply(200));
    vi.stubGlobal("fetch", fetcher);
    await edit(`https://food.example/recipes/${RECIPE_ID}`);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("‘김치볶음밥’ 레시피를 불러왔어요");
  });

  test("불러온 뒤 삭제된 레시피는 같은 주소를 다시 붙여 넣으면 다시 확인한다", async () => {
    vi.stubGlobal("fetch", async () => reply(200));
    await mount(RECIPE_ID, "김치볶음밥");
    vi.stubGlobal("fetch", async () => reply(404));
    await load();
    const fetcher = vi.fn(async () => reply(404));
    vi.stubGlobal("fetch", fetcher);
    await edit(`https://food.example/recipes/${RECIPE_ID}`);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("레시피를 찾을 수 없어요. ID를 다시 확인해 주세요.");
    expect(container.textContent).not.toContain("레시피를 불러왔어요");
  });

  test("아직 불러오지 못한 레시피는 같은 주소를 붙여 넣어도 다시 불러온다", async () => {
    vi.stubGlobal("fetch", async () => reply(500));
    await mount(RECIPE_ID);
    expect(form.getValues("items.0.title")).toBeUndefined();
    vi.stubGlobal("fetch", async () => reply(200));
    await edit(`https://food.example/recipes/${RECIPE_ID}`);
    expect(input().value).toBe(RECIPE_ID);
    expect(form.getValues("items.0.title")).toBe("김치볶음밥");
  });

  test("제목 없이 저장돼 있던 레시피 칸은 화면을 열 때 불러온다", async () => {
    vi.stubGlobal("fetch", async () => reply(200));
    await mount(RECIPE_ID);
    expect(form.getValues("items.0.title")).toBe("김치볶음밥");
  });

  test("제목이 저장된 레시피 칸도 화면을 열 때 다시 확인한다", async () => {
    const fetcher = vi.fn(async () => reply(200));
    vi.stubGlobal("fetch", fetcher);
    await mount(RECIPE_ID, "예전 제목");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(form.getValues("items.0.title")).toBe("김치볶음밥");
  });

  test("화면을 열 때 다시 확인한 것만으로는 저장 안 한 변경이 생기지 않는다", async () => {
    vi.stubGlobal("fetch", async () => reply(200));
    await mount(RECIPE_ID, "예전 제목");
    expect(form.getFieldState("items").isDirty).toBe(false);
  });

  test("저장 뒤 삭제된 레시피는 열 때 찾을 수 없다고 알리고 저장 전 확인에 걸리게 불러온 정보를 지운다", async () => {
    vi.stubGlobal("fetch", async () => reply(404));
    await mount(RECIPE_ID, "김치볶음밥");
    expect(container.textContent).toContain("레시피를 찾을 수 없어요. ID를 다시 확인해 주세요.");
    expect(container.textContent).not.toContain("레시피를 불러왔어요");
    expect(form.getValues("items.0.title")).toBe("");
  });

  test("열 때 확인이 연결 문제로 실패하면 저장된 제목은 그대로 둔다", async () => {
    vi.stubGlobal("fetch", async () => reply(500));
    await mount(RECIPE_ID, "김치볶음밥");
    expect(container.textContent).toContain(
      "레시피를 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
    );
    expect(form.getValues("items.0.title")).toBe("김치볶음밥");
  });

  test("형식이 맞지 않는 ID로 저장돼 있던 칸은 화면을 열 때 불러오지 않는다", async () => {
    const fetcher = vi.fn(async () => reply(200));
    vi.stubGlobal("fetch", fetcher);
    await mount("틀린아이디");
    expect(fetcher).not.toHaveBeenCalled();
    expect(input().getAttribute("aria-invalid")).toBe("false");
  });

  test("한 칸에서 불러오던 레시피를 다른 레시피로 바꿔도 같은 레시피를 가진 다른 칸에 진행 표시가 남지 않는다", async () => {
    const other = "00000000-0000-4000-8000-000000000002";
    vi.stubGlobal("fetch", async () => reply(200));
    await mountItems([
      { type: "recipe", recipeid: "" },
      { type: "recipe", recipeid: RECIPE_ID, title: "김치볶음밥" },
    ]);
    const pending: ((response: Response) => void)[] = [];
    vi.stubGlobal(
      "fetch",
      () =>
        new Promise<Response>((done) => {
          pending.push(done);
        })
    );
    await edit(RECIPE_ID, 1);
    await edit(other, 1);
    await act(async () => pending[1]!(reply(200)));
    await act(async () => pending[0]!(reply(200)));
    expect(container.textContent).not.toContain("레시피를 불러오는 중이에요");
  });
});
