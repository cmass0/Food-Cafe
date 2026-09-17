import { expect, test } from "@playwright/test";

import { login } from "./support/auth";
import {
  AUTHOR_ACCOUNT,
  MENTION_EXPECTED_NAME,
  MENTION_QUERY,
  MUTATING_E2E_ENABLED,
  OTHER_ACCOUNT,
  uniqueTitle,
} from "./support/environment";
import { createPostThroughUi } from "./support/forms";
import { expectOtherUserCannotEdit } from "./support/ownership";
import { cleanupResource, resourceIdFromPage } from "./support/resources";

test.describe("게시글 CRUD와 멘션", () => {
  test("작성자는 생성·수정·삭제할 수 있다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let postId: string | null = null;
    let deleted = false;
    const title = uniqueTitle("게시글");
    const editedTitle = `${title} 수정`;

    await login(page, AUTHOR_ACCOUNT);
    try {
      await createPostThroughUi(page, title);
      postId = resourceIdFromPage(page, "posts");

      await page.goto(`/posts/edit?id=${postId}`);
      await page.getByLabel("제목").fill(editedTitle);
      await page.getByRole("button", { name: "수정", exact: true }).click();
      await expect(page).toHaveURL(`/posts/${postId}`);
      await expect(page.getByRole("heading", { name: editedTitle })).toBeVisible();

      await page.getByRole("button", { name: "삭제", exact: true }).first().click();
      const dialog = page.getByRole("alertdialog");
      await expect(dialog.getByText("게시글을 삭제하시겠습니까?")).toBeVisible();
      await dialog.getByRole("button", { name: "삭제", exact: true }).click();
      await expect(page).toHaveURL(/\/posts$/);
      deleted = true;
    } finally {
      if (!deleted) await cleanupResource(page, "posts", postId);
    }
  });

  test("다른 사용자는 작성자의 게시글을 수정할 수 없다", async ({ browser, page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !OTHER_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자·다른 사용자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT || !OTHER_ACCOUNT) return;

    let postId: string | null = null;

    await login(page, AUTHOR_ACCOUNT);
    try {
      await createPostThroughUi(page, uniqueTitle("타 사용자 권한 게시글"));
      postId = resourceIdFromPage(page, "posts");

      await expectOtherUserCannotEdit(
        browser,
        page,
        OTHER_ACCOUNT,
        `/posts/${postId}`,
        `/posts/edit?id=${postId}`
      );
    } finally {
      await cleanupResource(page, "posts", postId);
    }
  });

  test("에디터 멘션은 설정한 팔로잉 사용자를 후보로 표시한다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MENTION_QUERY || !MENTION_EXPECTED_NAME,
      "작성자 계정과 E2E_MENTION_QUERY/EXPECTED_NAME이 필요합니다."
    );
    if (!AUTHOR_ACCOUNT || !MENTION_QUERY || !MENTION_EXPECTED_NAME) return;

    await login(page, AUTHOR_ACCOUNT, "/posts/new");
    const editor = page.locator('[contenteditable="true"]');
    await editor.fill(`@${MENTION_QUERY}`);

    await expect(page.getByText("내 팔로잉", { exact: true })).toBeVisible();
    await expect(page.getByText(MENTION_EXPECTED_NAME, { exact: true })).toBeVisible();
  });
});
