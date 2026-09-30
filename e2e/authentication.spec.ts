import { expect, test } from "@playwright/test";

import { expectLoginModal, login, loginFromVisibleModal, openLoginModal } from "./support/auth";
import { AUTHOR_ACCOUNT, MUTATING_E2E_ENABLED, uniqueTitle } from "./support/environment";
import { createRecipeThroughUi } from "./support/forms";
import { cleanupResource, resourceIdFromPage } from "./support/resources";

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

  test("자동 로그아웃되면 페이지 이동 없이 작성자 전용 버튼을 지우고 알린다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let recipeId: string | null = null;
    await login(page, AUTHOR_ACCOUNT);
    try {
      await createRecipeThroughUi(page, uniqueTitle("자동 로그아웃 레시피"));
      recipeId = resourceIdFromPage(page, "recipes");
      // 수정 버튼은 서버가 작성자일 때만 그린다. 서버 화면을 다시 받아야 사라진다.
      const editButton = page.getByRole("button", { name: "수정", exact: true });
      await expect(editButton).toBeVisible();

      // "로그인 유지"를 끄고 자동 로그아웃 시각을 몇 초 뒤로 당긴 뒤 다시 연다.
      await page.evaluate(() => {
        localStorage.setItem("FC_REMEMBER", "0");
        localStorage.setItem("FC_LOGOUT_AT", String(Date.now() + 4_000));
      });
      await page.reload();
      await expect(editButton).toBeVisible();

      await expect(page.getByText("로그인이 만료되어 로그아웃되었습니다.")).toBeVisible({
        timeout: 15_000,
      });
      await expect(editButton).toHaveCount(0);
      await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeVisible();
      expect(new URL(page.url()).pathname).toBe(`/recipes/${recipeId}`);
    } finally {
      // 정리 요청은 작성자 세션이 필요하다.
      if (recipeId) {
        await login(page, AUTHOR_ACCOUNT);
        await cleanupResource(page, "recipes", recipeId);
      }
    }
  });
});
