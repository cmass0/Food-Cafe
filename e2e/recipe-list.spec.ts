import { expect, test, type Page } from "@playwright/test";

import { login } from "./support/auth";
import { AUTHOR_ACCOUNT, MUTATING_E2E_ENABLED } from "./support/environment";

function likeButtonOf(page: Page, title: string) {
  return page
    .locator("article")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
    .getByRole("button", { name: /^좋아요 / });
}

test.describe("레시피 목록", () => {
  test("목록 카드는 브라우저 조회 없이 서버 HTML에 담겨 온다", async ({ request }) => {
    const response = await request.get("/recipes");
    expect(response.ok()).toBe(true);
    const html = await response.text();
    test.skip(html.includes("조건에 맞는 레시피가 없습니다."), "표시할 레시피가 없는 DB입니다.");

    // 예전에는 JS 실행 뒤 /api/recipes로 목록을 받아 첫 HTML에는 카드가 없었다.
    expect(html).toContain("상세 보기");
  });

  test("목록 API는 page·limit 없이도 첫 페이지를 돌려준다", async ({ request }) => {
    // 예전에는 없는 page·limit을 0으로 읽어 입력 검증에서 500이 났다.
    const response = await request.get("/api/recipes");
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { data: { items: unknown[]; offset: number } };
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(body.data.offset).toBe(0);
  });

  test("상한을 넘는 limit은 오류 대신 상한으로 줄여 보여준다", async ({ page }) => {
    // 예전에는 limit=100이 입력 검증(최대 50)에서 막혀 목록 대신 오류 화면이 나왔다.
    await page.goto("/recipes?limit=100");
    await expect(page.getByText("레시피 목록을 표시하지 못했습니다.")).toHaveCount(0);
    expect(await page.locator("article").count()).toBeLessThanOrEqual(50);
  });

  test("기본이 아닌 limit은 페이지 이동 링크에도 남는다", async ({ page }) => {
    // 링크에서 limit이 빠지면 2페이지가 기본 크기(12)로 계산돼 6~12번째 항목을 건너뛴다.
    await page.goto("/recipes?limit=5");
    const secondPage = page.locator('a[href*="page=2"]').first();
    test.skip((await secondPage.count()) === 0, "두 페이지 이상 표시할 레시피가 없는 DB입니다.");

    const href = (await secondPage.getAttribute("href")) ?? "";
    expect(new URL(href, page.url()).searchParams.get("limit")).toBe("5");
  });

  test("정렬 탭을 바꾸면 주소의 sort가 바뀌고 첫 페이지로 돌아간다", async ({ page }) => {
    await page.goto("/recipes?page=1");

    await page.getByRole("tab", { name: "좋아요", exact: true }).click();
    await expect(page).toHaveURL(/\/recipes\?sort=like$/);
    await expect(page.getByRole("tab", { name: "좋아요", exact: true })).toHaveAttribute(
      "data-state",
      "active"
    );

    await page.getByRole("tab", { name: "최신", exact: true }).click();
    await expect(page).toHaveURL(/\/recipes$/);
  });

  test("검색하면 검색 조건이 주소에 남고 현재 정렬을 유지한다", async ({ page }) => {
    await page.goto("/recipes?sort=view");

    const main = page.getByRole("main");
    await main.getByPlaceholder("레시피 검색...").fill("김치");
    await main.getByRole("button", { name: "검색", exact: true }).click();

    await expect
      .poll(() => Object.fromEntries(new URL(page.url()).searchParams))
      .toEqual({ search: "김치", searchField: "title", sort: "view" });
    await expect(page.getByPlaceholder("레시피 검색...")).toHaveValue("김치");
  });

  test("자동 로그아웃되면 페이지 이동 없이 좋아요 표시를 지우고 알린다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    await login(page, AUTHOR_ACCOUNT, "/recipes");
    const title = (await page.locator("article h2").first().textContent())?.trim() ?? "";
    test.skip(!title, "표시할 레시피가 없는 DB입니다.");
    const likeButton = likeButtonOf(page, title);

    const likedBefore = (await likeButton.getAttribute("aria-pressed")) === "true";
    if (!likedBefore) {
      await likeButton.click();
      await expect(likeButton).toHaveAttribute("aria-pressed", "true");
    }

    try {
      // "로그인 유지"를 끄고 자동 로그아웃 시각을 몇 초 뒤로 당긴 뒤 다시 연다.
      await page.evaluate(() => {
        localStorage.setItem("FC_REMEMBER", "0");
        localStorage.setItem("FC_LOGOUT_AT", String(Date.now() + 4_000));
      });
      await page.reload();
      await expect(likeButton).toHaveAttribute("aria-pressed", "true");

      await expect(page.getByText("로그인이 만료되어 로그아웃되었습니다.")).toBeVisible({
        timeout: 15_000,
      });
      await expect(likeButton).toHaveAttribute("aria-pressed", "false");
      await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeVisible();
      expect(new URL(page.url()).pathname).toBe("/recipes");
    } finally {
      if (!likedBefore) {
        await login(page, AUTHOR_ACCOUNT, "/recipes");
        const restore = likeButtonOf(page, title);
        await restore.click();
        await expect(restore).toHaveAttribute("aria-pressed", "false");
      }
    }
  });
});
