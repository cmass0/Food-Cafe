// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { act, useState, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { notFound } from "next/navigation";
import { ErrorBoundary } from "react-error-boundary";
import {
  AppRouterContext,
  type AppRouterInstance,
} from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";

import Section from "./Section";

let root: Root | undefined;
let container: HTMLDivElement;

function renderWithRouter(content: ReactNode, refresh = vi.fn()) {
  const router: AppRouterInstance = {
    back() {},
    forward() {},
    push() {},
    replace() {},
    prefetch() {},
    refresh,
    // Next 16.3에서 라우터에 추가된 필수 값. 이 테스트는 쓰지 않는다.
    bfcacheId: "test",
  };
  return <AppRouterContext.Provider value={router}>{content}</AppRouterContext.Provider>;
}

function atUrl(url: string, content: ReactNode) {
  const { pathname, searchParams } = new URL(url, "http://localhost");
  return (
    <PathnameContext.Provider value={pathname}>
      <SearchParamsContext.Provider value={searchParams}>{content}</SearchParamsContext.Provider>
    </PathnameContext.Provider>
  );
}

async function mount(content: ReactNode, refresh = vi.fn()) {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root!.render(renderWithRouter(content, refresh)));
}

async function clickButton(label: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (item) => item.textContent === label
  );
  if (!button) throw new Error(`버튼 없음: ${label}`);
  await act(async () => button.click());
}

function ThrowingCard({ broken }: { broken: boolean }) {
  if (broken) throw new Error("내부 비공개 진단 정보");
  return <p>복구된 카드</p>;
}

afterEach(async () => {
  await act(async () => root?.unmount());
  container?.remove();
  root = undefined;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Section", () => {
  test("404 제어 예외는 섹션 오류로 숨기지 않고 상위 경계로 전달한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    function MissingContent(): never {
      return notFound();
    }
    await mount(
      <ErrorBoundary fallback={<p>상위 404 처리</p>}>
        <Section name="cards" title="카드 표시 실패">
          <MissingContent />
        </Section>
      </ErrorBoundary>
    );
    expect(container.textContent).toBe("상위 404 처리");
  });

  test("재시도 후에도 원인이 남아 있으면 오류 안내를 유지한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await mount(
      <Section name="cards" title="카드 표시 실패">
        <ThrowingCard broken />
      </Section>
    );
    await clickButton("다시 시도");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("카드 표시 실패");
    expect(container.querySelector("button")?.disabled).toBe(false);
  });

  test("조회 실패는 자식을 실행하지 않고 공통 안내로 표시한다", async () => {
    await mount(
      <Section name="popular" title="인기글 조회 실패" failed>
        <ThrowingCard broken />
      </Section>
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("인기글 조회 실패");
    expect(container.textContent).not.toContain("내부 비공개 진단 정보");
  });

  test("범위 밖 페이지는 자식 대신 안내를 보여 주고 현재 주소에서 해당 페이지 값만 지운 링크를 건다", async () => {
    await mount(
      atUrl(
        "/search?query=kimchi&recipePage=999&comboPage=2",
        <Section
          name="search.recipes"
          title="검색 결과 조회 실패"
          outOfRange
          pageParam="recipePage"
        >
          <p>검색 결과 목록</p>
        </Section>
      )
    );
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      "이 페이지에는 표시할 항목이 없습니다."
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/search?query=kimchi&comboPage=2"
    );
    expect(container.textContent).not.toContain("검색 결과 목록");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  test("페이지 쿼리 이름을 주지 않으면 page를 지우고, 남는 쿼리가 없으면 경로만 링크한다", async () => {
    await mount(
      atUrl(
        "/recipes?page=999",
        <Section name="recipes.list" title="레시피 조회 실패" outOfRange>
          <p>레시피 목록</p>
        </Section>
      )
    );
    expect(container.querySelector("a")?.getAttribute("href")).toBe("/recipes");
  });

  test("조회 실패와 범위 밖이 함께 오면 다시 시도 안내를 우선한다", async () => {
    await mount(
      atUrl(
        "/search?recipePage=999",
        <Section name="search.recipes" title="검색 결과 조회 실패" failed outOfRange>
          <p>검색 결과 목록</p>
        </Section>
      )
    );
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("검색 결과 조회 실패");
    expect(container.querySelector('[role="status"]')).toBeNull();
  });

  test("정상 빈 결과는 오류로 바꾸지 않고 표시한다", async () => {
    await mount(
      <Section name="popular" title="인기글 조회 실패">
        <p>인기글이 없습니다.</p>
      </Section>
    );
    expect(container.textContent).toBe("인기글이 없습니다.");
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  test("깊은 자식 오류와 재시도에도 형제 영역의 입력 상태를 보존한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    function Screen() {
      const [broken, setBroken] = useState(false);
      const [draft, setDraft] = useState("");
      return (
        <>
          <button onClick={() => setDraft("작성 중인 내용")}>초안 작성</button>
          <input aria-label="초안" value={draft} readOnly />
          <button onClick={() => setBroken(true)}>카드 오류</button>
          <Section name="cards" title="카드 표시 실패" onRetry={() => setBroken(false)}>
            <div>
              <ThrowingCard broken={broken} />
            </div>
          </Section>
        </>
      );
    }
    await mount(<Screen />);
    await clickButton("초안 작성");
    await clickButton("카드 오류");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("카드 표시 실패");
    expect(container.textContent).not.toContain("내부 비공개 진단 정보");
    expect(container.querySelector("input")?.value).toBe("작성 중인 내용");
    await clickButton("다시 시도");
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.textContent).toContain("복구된 카드");
    expect(container.querySelector("input")?.value).toBe("작성 중인 내용");
  });

  test("대상이 바뀌면 이전 렌더링 오류를 초기화한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    await mount(
      <Section name="cards" title="카드 표시 실패" resetKeys={["old"]}>
        <ThrowingCard broken />
      </Section>
    );
    await act(async () =>
      root!.render(
        renderWithRouter(
          <Section name="cards" title="카드 표시 실패" resetKeys={["new"]}>
            <ThrowingCard broken={false} />
          </Section>
        )
      )
    );
    expect(container.textContent).toBe("복구된 카드");
  });

  test("기본 재시도는 라우트를 갱신하고 성공 결과가 도착하면 콘텐츠를 표시한다", async () => {
    const refresh = vi.fn();
    await mount(
      <Section name="cards" title="조회 실패" failed>
        <p>조회 결과</p>
      </Section>,
      refresh
    );
    await clickButton("다시 시도");
    expect(refresh).toHaveBeenCalledOnce();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("조회 실패");
    await act(async () =>
      root!.render(
        renderWithRouter(
          <Section name="cards" title="조회 실패" failed={false}>
            <p>조회 결과</p>
          </Section>,
          refresh
        )
      )
    );
    expect(container.textContent).toBe("조회 결과");
  });

  test("재조회 대기 중 중복 재시도를 막고 실패하면 오류 안내를 유지한다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const deferred = Promise.withResolvers<void>();
    await mount(
      <Section name="cards" title="조회 실패" failed onRetry={() => deferred.promise}>
        <p>조회 결과</p>
      </Section>
    );
    await clickButton("다시 시도");
    const button = container.querySelector("button");
    expect(button?.disabled).toBe(true);
    expect(button?.textContent).toBe("불러오는 중");
    await act(async () => deferred.reject(new Error("재조회 실패")));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("조회 실패");
    expect(button?.disabled).toBe(false);
    expect(container.textContent).not.toContain("조회 결과");
  });
});
