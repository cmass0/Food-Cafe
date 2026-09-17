import { expect, test } from "@playwright/test";

import { login } from "./support/auth";
import {
  AUTHOR_ACCOUNT,
  MUTATING_E2E_ENABLED,
  OTHER_ACCOUNT,
  uniqueTitle,
} from "./support/environment";
import { createComboThroughUi } from "./support/forms";
import { expectOtherUserCannotEdit } from "./support/ownership";
import { cleanupResource, resourceIdFromPage } from "./support/resources";

test.describe("조합 CRUD와 소유권", () => {
  test("작성자는 생성·수정·삭제할 수 있다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let comboId: string | null = null;
    let deleted = false;
    const title = uniqueTitle("조합");
    const editedTitle = `${title} 수정`;

    await login(page, AUTHOR_ACCOUNT);
    try {
      await createComboThroughUi(page, title);
      comboId = resourceIdFromPage(page, "combos");

      await page.goto(`/combos/edit?id=${comboId}`);
      await page.getByRole("textbox", { name: "조합 제목", exact: true }).fill(editedTitle);
      await page.getByRole("button", { name: "수정", exact: true }).click();
      await expect(page).toHaveURL(`/combos/${comboId}`);
      await expect(page.getByRole("heading", { name: editedTitle })).toBeVisible();

      await page.getByRole("button", { name: "삭제", exact: true }).first().click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog).toContainText("삭제하시겠습니까?");
      await dialog.getByRole("button", { name: "삭제", exact: true }).click();
      await expect(page).toHaveURL(/\/combos$/);
      deleted = true;
    } finally {
      if (!deleted) await cleanupResource(page, "combos", comboId);
    }
  });

  test("다른 사용자는 작성자의 조합을 수정할 수 없다", async ({ browser, page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !OTHER_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자·다른 사용자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT || !OTHER_ACCOUNT) return;

    let comboId: string | null = null;

    await login(page, AUTHOR_ACCOUNT);
    try {
      await createComboThroughUi(page, uniqueTitle("타 사용자 권한 조합"));
      comboId = resourceIdFromPage(page, "combos");

      await expectOtherUserCannotEdit(
        browser,
        page,
        OTHER_ACCOUNT,
        `/combos/${comboId}`,
        `/combos/edit?id=${comboId}`
      );
    } finally {
      await cleanupResource(page, "combos", comboId);
    }
  });
});
