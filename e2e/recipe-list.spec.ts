import { expect, test } from "@playwright/test";

test.describe("레시피 목록", () => {
  test("목록 카드는 브라우저 조회 없이 서버 HTML에 담겨 온다", async ({ request }) => {
    const response = await request.get("/recipes");
    expect(response.ok()).toBe(true);
    const html = await response.text();
    test.skip(html.includes("조건에 맞는 레시피가 없습니다."), "표시할 레시피가 없는 DB입니다.");

    // 예전에는 JS 실행 뒤 /api/recipes로 목록을 받아 첫 HTML에는 카드가 없었다.
    expect(html).toContain("상세 보기");
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
});
