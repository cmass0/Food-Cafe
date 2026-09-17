import { expect, test } from "@playwright/test";

test.describe("모바일·접근성", () => {
  test("주요 공개 화면은 제목과 내비게이션 랜드마크를 제공한다", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("navigation").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel("사이트 검색어")).toBeVisible();
  });

  test("키보드 Tab 이동이 첫 내비게이션 링크에 도달한다", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");

    await expect(page.getByRole("link", { name: "FoodCafe", exact: true }).first()).toBeFocused();
  });

  test("모바일 메뉴를 닫은 뒤 로그인 모달을 열어 포커스 계층이 겹치지 않는다", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await page.getByRole("button", { name: "메뉴 열기" }).click();
    const menu = page.getByRole("dialog", { name: "FoodCafe" });
    await expect(menu).toBeVisible();
    await menu.getByRole("button", { name: "로그인", exact: true }).click();

    await expect(menu).toBeHidden();
    await expect(page.getByRole("dialog", { name: "로그인 또는 회원가입" })).toBeVisible();
  });

  test("모바일 핵심 버튼은 최소 44px 터치 영역을 유지한다", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const menuButton = page.getByRole("button", { name: "메뉴 열기" });
    const box = await menuButton.boundingBox();

    expect(box).not.toBeNull();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });
});
