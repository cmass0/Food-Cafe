import { expect, test } from "@playwright/test";

const PUBLIC_PAGES = [
  { path: "/", heading: /함께 나누는 레시피/ },
  { path: "/recipes", heading: "레시피" },
  { path: "/combos", heading: "레시피 조합" },
  { path: "/posts", heading: "커뮤니티" },
  { path: "/search", heading: /전체.*검색 결과/ },
  { path: "/ranking", heading: /최근 7일 TOP 50/ },
] as const;

test.describe("공개 페이지 탐색", () => {
  for (const item of PUBLIC_PAGES) {
    test(`${item.path} 페이지가 정상 응답하고 핵심 제목을 표시한다`, async ({ page }) => {
      const response = await page.goto(item.path);

      expect(response?.ok(), `${item.path} 문서 응답이 성공해야 합니다.`).toBeTruthy();
      await expect(page.getByRole("heading", { level: 1, name: item.heading })).toBeVisible();
    });
  }

  test("데스크톱 내비게이션으로 주요 페이지를 이동한다", async ({ page }) => {
    await page.goto("/");

    const navigation = page.getByRole("navigation").first();
    await navigation.getByRole("link", { name: "레시피 조합", exact: true }).click();

    await expect(page).toHaveURL(/\/combos$/);
    await expect(page.getByRole("heading", { level: 1, name: "레시피 조합" })).toBeVisible();
  });

  for (const resource of ["posts", "recipes", "combos"] as const) {
    test(`${resource} 상세에 잘못된 ID가 들어오면 개발 오류 대신 404를 표시한다`, async ({
      page,
    }) => {
      await page.goto(`/${resource}/3`);

      // App Router가 스트리밍을 시작한 뒤 notFound()가 호출되면 문서 상태는 200일 수 있다.
      // 이 경우 사용자에게 노출되는 404 계약을 기준으로 검증한다.
      await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" })).toBeVisible();
      await expect(page.getByText(/22P02|invalid input syntax/i)).toHaveCount(0);
    });
  }

  test("존재하지 않는 경로에서 홈으로 복귀한다", async ({ page }) => {
    const response = await page.goto("/e2e-not-found-page");

    expect(response?.status()).toBe(404);
    await page.getByRole("link", { name: "홈으로 이동" }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});
