import { expect, test } from "@playwright/test";

test.describe("랭킹", () => {
  test("기간을 바꿔도 선택한 콘텐츠 종류를 유지한다", async ({ page }) => {
    await page.goto("/ranking?period=week&type=combo");

    await page
      .getByRole("navigation", { name: "랭킹 기간" })
      .getByRole("link", { name: "일간" })
      .click();
    await expect(page).toHaveURL(/\/ranking\?period=day&type=combo$/);

    const current = new URL(page.url());
    expect(current.searchParams.get("period")).toBe("day");
    expect(current.searchParams.get("type")).toBe("combo");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("최근 24시간");
  });

  test("콘텐츠 종류를 바꿔도 선택한 기간을 유지한다", async ({ page }) => {
    await page.goto("/ranking?period=month&type=recipe");

    await page
      .getByRole("navigation", { name: "랭킹 종류" })
      .getByRole("link", { name: "레시피 조합" })
      .click();
    await expect(page).toHaveURL(/\/ranking\?period=month&type=combo$/);

    const current = new URL(page.url());
    expect(current.searchParams.get("period")).toBe("month");
    expect(current.searchParams.get("type")).toBe("combo");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("최근 1개월");
  });

  test("잘못된 기간과 종류는 기본 랭킹으로 정규화해 표시한다", async ({ page }) => {
    await page.goto("/ranking?period=year&type=post");

    await expect(
      page.getByRole("navigation", { name: "랭킹 기간" }).getByRole("link", { name: "주간" })
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page
        .getByRole("navigation", { name: "랭킹 종류" })
        .getByRole("link", { name: "레시피", exact: true })
    ).toHaveAttribute("aria-current", "page");
  });
});
