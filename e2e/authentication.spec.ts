import { expect, test } from "@playwright/test";

import { expectLoginModal, loginFromVisibleModal, openLoginModal } from "./support/auth";
import { AUTHOR_ACCOUNT } from "./support/environment";

test.describe("인증", () => {
  test("내비게이션에서 로그인 모달을 열고 빈 입력을 안내한다", async ({ page }) => {
    const dialog = await openLoginModal(page);
    await dialog.locator("form").getByRole("button", { name: "로그인", exact: true }).click();

    await expect(dialog.getByText("이메일과 비밀번호를 입력해주세요.")).toBeVisible();
  });

  test("비로그인 사용자가 보호 경로에 접근하면 로그인 모달을 표시한다", async ({ page }) => {
    await page.goto("/recipes/new");

    await expectLoginModal(page);
    await expect(page).toHaveURL(/\/$/);
  });

  test("외부 복귀 주소는 로그인 모달을 열어도 브라우저 주소로 사용하지 않는다", async ({
    page,
  }) => {
    await page.goto("/?auth=login&next=https%3A%2F%2Fexample.com%2Fphishing");

    await expectLoginModal(page);
    await expect(page).toHaveURL(/\/$/);
  });

  test("로그인 성공 후 원래 보호 경로로 돌아간다", async ({ page }) => {
    test.skip(!AUTHOR_ACCOUNT, "E2E_AUTHOR_EMAIL/PASSWORD가 필요합니다.");
    if (!AUTHOR_ACCOUNT) return;

    await page.goto("/recipes/new");
    await loginFromVisibleModal(page, AUTHOR_ACCOUNT, "/recipes/new");

    await expect(page.getByRole("heading", { name: "레시피 등록" })).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인", exact: true })).toHaveCount(0);
  });
});
