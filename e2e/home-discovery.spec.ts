import { expect, test } from "@playwright/test";

const CATEGORIES = [
  ["전체", "/recipes"],
  ["한식", "/recipes?category=korean"],
  ["중식", "/recipes?category=chinese"],
  ["일식", "/recipes?category=japanese"],
  ["양식", "/recipes?category=western"],
  ["디저트", "/recipes?category=dessert"],
  ["샐러드", "/recipes?category=salad"],
  ["간식", "/recipes?category=snack"],
  ["다이어트", "/recipes?category=diet"],
] as const;

test.describe("홈 발견 영역", () => {
  test("인기·신규·커뮤니티·태그·트렌딩 영역을 구분해 표시한다", async ({ page }) => {
    await page.goto("/");

    for (const heading of [
      "최근 7일 인기 레시피",
      "새로 올라온 레시피",
      "커뮤니티 인기 이야기",
      "이번 주 인기 태그",
      "지금 뜨는 레시피·조합",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("카테고리 링크가 정의된 레시피 필터 URL을 사용한다", async ({ page }) => {
    await page.goto("/");

    for (const [label, href] of CATEGORIES) {
      await expect(page.getByRole("link", { name: label, exact: true })).toHaveAttribute(
        "href",
        href
      );
    }
  });

  test("홈 검색어를 통합검색에 전달한다", async ({ page }) => {
    await page.goto("/");
    const searchForm = page.locator("form").filter({
      has: page.getByPlaceholder("오늘 뭐 먹지? 레시피를 검색해보세요!"),
    });
    await searchForm.getByPlaceholder("오늘 뭐 먹지? 레시피를 검색해보세요!").fill("파스타");
    await searchForm.getByRole("button", { name: "검색", exact: true }).click();

    await expect(page).toHaveURL(/\/search\?query=%ED%8C%8C%EC%8A%A4%ED%83%80$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("파스타");
  });
});
