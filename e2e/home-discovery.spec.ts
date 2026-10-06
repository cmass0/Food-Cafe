import { expect, test } from "@playwright/test";

const CATEGORIES = [
  ["전체", "/recipes"],
  ["한식", "/recipes?category=korean"],
  ["고기·구이", "/recipes?category=meat"],
  ["분식", "/recipes?category=bunsik"],
  ["중식", "/recipes?category=chinese"],
  ["일식", "/recipes?category=japanese"],
  ["양식", "/recipes?category=western"],
  ["아시안", "/recipes?category=asian"],
  ["샐러드·건강식", "/recipes?category=salad"],
  ["디저트·베이킹", "/recipes?category=dessert"],
  ["간식·야식", "/recipes?category=snack"],
] as const;

test.describe("홈 발견 영역", () => {
  test("인기·신규·커뮤니티·태그·트렌딩 영역을 구분해 표시한다", async ({ page }) => {
    await page.goto("/");

    for (const heading of [
      "최근 7일 인기 레시피",
      "새로 올라온 레시피",
      "커뮤니티 인기 이야기",
      "최근 7일 인기 태그",
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
});
