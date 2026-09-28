import { expect, test } from "@playwright/test";

test.describe("통합검색", () => {
  test("내비게이션 검색어를 URL과 검색 결과 제목에 반영한다", async ({ page }) => {
    await page.goto("/");
    const header = page.getByRole("banner");
    await header.getByLabel("사이트 검색어").fill("김치볶음밥");
    await header.getByRole("button", { name: "검색", exact: true }).click();

    await expect(page).toHaveURL(/\/search\?query=/);
    expect(new URL(page.url()).searchParams.get("query")).toBe("김치볶음밥");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("김치볶음밥");
  });

  test("정렬과 보기 방식을 바꾸면 검색어는 유지하고 페이지 번호는 초기화한다", async ({ page }) => {
    await page.goto("/search?query=test&recipePage=1&comboPage=1&postPage=1");

    await page.getByLabel("검색 결과 정렬").selectOption("like");
    await expect.poll(() => new URL(page.url()).searchParams.get("sort")).toBe("like");
    expect(new URL(page.url()).searchParams.get("recipePage")).toBeNull();
    expect(new URL(page.url()).searchParams.get("comboPage")).toBeNull();
    expect(new URL(page.url()).searchParams.get("postPage")).toBeNull();

    await page.getByRole("button", { name: "목록 보기" }).click();
    await expect.poll(() => new URL(page.url()).searchParams.get("view")).toBe("list");
    expect(new URL(page.url()).searchParams.get("query")).toBe("test");
  });

  test("레시피 페이지 범위를 벗어나도 다른 검색 영역을 유지한다", async ({ page }) => {
    await page.goto("/search?recipePage=999");

    await expect(page.getByLabel("검색 결과 정렬")).toBeVisible();
    const recipeSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "레시피", exact: true }),
    });
    // 범위 밖 페이지는 '결과 없음'이 아니라 첫 페이지로 돌아가는 안내를 보여 준다(노션 ID 37).
    await expect(recipeSection.getByText("이 페이지에는 표시할 항목이 없습니다.")).toBeVisible();
    await expect(recipeSection.getByRole("link", { name: "첫 페이지로" })).toHaveAttribute(
      "href",
      "/search"
    );
    await expect(page.getByRole("heading", { name: "레시피 조합" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "커뮤니티" })).toBeVisible();
    await expect(page.getByText("페이지를 불러오지 못했습니다")).toHaveCount(0);
  });

  for (const query of ["%", "_", "'"]) {
    test(`특수문자 ${query} 검색이 오류 화면을 만들지 않는다`, async ({ page }) => {
      const response = await page.goto(`/search?query=${encodeURIComponent(query)}`);

      expect(response?.ok()).toBeTruthy();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByText("일시적인 오류가 발생했습니다")).toHaveCount(0);
    });
  }
});
