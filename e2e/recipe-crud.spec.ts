import { expect, test } from "@playwright/test";

import { login } from "./support/auth";
import {
  ADMIN_ACCOUNT,
  AUTHOR_ACCOUNT,
  MUTATING_E2E_ENABLED,
  OTHER_ACCOUNT,
  uniqueTitle,
} from "./support/environment";
import { createRecipeThroughUi } from "./support/forms";
import { expectOtherUserCannotEdit } from "./support/ownership";
import { cleanupResource, resourceIdFromPage } from "./support/resources";

test.describe("레시피 CRUD와 소유권", () => {
  test("작성자는 생성·수정·삭제할 수 있다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let recipeId: string | null = null;
    let deleted = false;
    const title = uniqueTitle("레시피");
    const editedTitle = `${title} 수정`;

    await login(page, AUTHOR_ACCOUNT);
    try {
      await createRecipeThroughUi(page, title);
      recipeId = resourceIdFromPage(page, "recipes");

      await page.goto(`/recipes/edit?id=${recipeId}`);
      await page.getByLabel("레시피 제목").fill(editedTitle);
      await page.getByRole("button", { name: "수정", exact: true }).click();
      await expect(page).toHaveURL(`/recipes/${recipeId}`);
      await expect(page.getByRole("heading", { name: editedTitle })).toBeVisible();

      await page.getByRole("button", { name: "삭제", exact: true }).first().click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog.getByText("레시피를 삭제하시겠습니까?")).toBeVisible();
      await dialog.getByRole("button", { name: "삭제", exact: true }).click();
      await expect(page).toHaveURL(/\/recipes$/);
      deleted = true;
    } finally {
      if (!deleted) await cleanupResource(page, "recipes", recipeId);
    }
  });

  test("다른 사용자는 작성자의 레시피를 수정할 수 없다", async ({ browser, page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !OTHER_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자·다른 사용자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT || !OTHER_ACCOUNT) return;

    let recipeId: string | null = null;

    await login(page, AUTHOR_ACCOUNT);
    try {
      await createRecipeThroughUi(page, uniqueTitle("타 사용자 권한 레시피"));
      recipeId = resourceIdFromPage(page, "recipes");

      await expectOtherUserCannotEdit(
        browser,
        page,
        OTHER_ACCOUNT,
        `/recipes/${recipeId}`,
        `/recipes/edit?id=${recipeId}`
      );
    } finally {
      await cleanupResource(page, "recipes", recipeId);
    }
  });

  test("관리자는 다른 작성자의 레시피를 수정할 수 없고 삭제할 수 있다", async ({
    browser,
    page,
  }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !ADMIN_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자·관리자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT || !ADMIN_ACCOUNT) return;

    let recipeId: string | null = null;
    let deleted = false;

    await login(page, AUTHOR_ACCOUNT);
    try {
      await createRecipeThroughUi(page, uniqueTitle("관리자 권한 레시피"));
      recipeId = resourceIdFromPage(page, "recipes");

      const adminContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
      const adminPage = await adminContext.newPage();
      try {
        await login(adminPage, ADMIN_ACCOUNT, `/recipes/${recipeId}`);
        await expect(adminPage.getByRole("button", { name: "수정", exact: true })).toHaveCount(0);
        await adminPage.getByRole("button", { name: "삭제", exact: true }).click();

        const dialog = adminPage.getByRole("alertdialog");
        await dialog.getByRole("button", { name: "삭제", exact: true }).click();
        await expect(adminPage).toHaveURL(/\/recipes$/);
        deleted = true;
      } finally {
        await adminContext.close();
      }
    } finally {
      if (!deleted) await cleanupResource(page, "recipes", recipeId);
    }
  });
});
