import { expect, test, type BrowserContext } from "@playwright/test";

import { expectLoginModal, login } from "./support/auth";
import { AUTHOR_ACCOUNT, MUTATING_E2E_ENABLED, uniqueTitle } from "./support/environment";
import { createPostThroughUi } from "./support/forms";
import { cleanupResource, resourceIdFromPage } from "./support/resources";

test.describe("좋아요·북마크·댓글", () => {
  test("비로그인 반응 시 데이터보다 먼저 로그인 모달을 표시한다", async ({ browser, page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let postId: string | null = null;
    let anonymousContext: BrowserContext | null = null;
    await login(page, AUTHOR_ACCOUNT);
    try {
      await createPostThroughUi(page, uniqueTitle("비로그인 반응 게시글"));
      postId = resourceIdFromPage(page, "posts");

      anonymousContext = await browser.newContext({ baseURL: new URL(page.url()).origin });
      const anonymousPage = await anonymousContext.newPage();
      await anonymousPage.goto(`/posts/${postId}`);

      const likeButton = anonymousPage.locator('button[aria-label^="좋아요 "]').first();
      const pressedBefore = await likeButton.getAttribute("aria-pressed");
      await likeButton.click();

      await expectLoginModal(anonymousPage);
      expect(await likeButton.getAttribute("aria-pressed")).toBe(pressedBefore);
    } finally {
      await anonymousContext?.close();
      await cleanupResource(page, "posts", postId);
    }
  });

  test("로그인 사용자의 반응과 댓글이 즉시 반영되고 새로고침 후 유지된다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let postId: string | null = null;
    const title = uniqueTitle("소셜 동작 게시글");
    const comment = uniqueTitle("댓글");

    await login(page, AUTHOR_ACCOUNT);
    try {
      await createPostThroughUi(page, title);
      postId = resourceIdFromPage(page, "posts");

      const likeButton = page.getByRole("button", { name: /^좋아요 / });
      const bookmarkButton = page.getByRole("button", { name: /^북마크 / });
      const initialLike = await likeButton.getAttribute("aria-pressed");
      const initialBookmark = await bookmarkButton.getAttribute("aria-pressed");

      const likeResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().endsWith(`/api/posts/${postId}/like`)
      );
      await likeButton.click();
      await expect((await likeResponsePromise).ok()).toBe(true);
      await expect(likeButton).toHaveAttribute(
        "aria-pressed",
        initialLike === "true" ? "false" : "true"
      );
      const bookmarkResponsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().endsWith(`/api/posts/${postId}/bookmark`)
      );
      await bookmarkButton.click();
      await expect((await bookmarkResponsePromise).ok()).toBe(true);
      await expect(bookmarkButton).toHaveAttribute(
        "aria-pressed",
        initialBookmark === "true" ? "false" : "true"
      );

      await page.reload();
      await expect(page.getByRole("button", { name: /^좋아요 / })).toHaveAttribute(
        "aria-pressed",
        initialLike === "true" ? "false" : "true"
      );
      await expect(page.getByRole("button", { name: /^북마크 / })).toHaveAttribute(
        "aria-pressed",
        initialBookmark === "true" ? "false" : "true"
      );

      await page.getByPlaceholder("댓글을 입력해주세요.").fill(comment);
      await page.getByRole("button", { name: "댓글 작성" }).click();
      await expect(page.getByText(comment, { exact: true })).toBeVisible();

      const commentRow = page.getByText(comment, { exact: true }).locator("..");
      await commentRow.getByRole("button", { name: "삭제", exact: true }).click();
      const dialog = page.getByRole("alertdialog");
      await dialog.getByRole("button", { name: "삭제", exact: true }).click();
      await expect(page.getByText("삭제된 댓글입니다.")).toBeVisible();

      const restoreLikeResponse = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().endsWith(`/api/posts/${postId}/like`)
      );
      await page.getByRole("button", { name: /^좋아요 / }).click();
      await expect((await restoreLikeResponse).ok()).toBe(true);

      const restoreBookmarkResponse = page.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().endsWith(`/api/posts/${postId}/bookmark`)
      );
      await page.getByRole("button", { name: /^북마크 / }).click();
      await expect((await restoreBookmarkResponse).ok()).toBe(true);
      await expect(page.getByRole("button", { name: /^좋아요 / })).toHaveAttribute(
        "aria-pressed",
        initialLike ?? "false"
      );
      await expect(page.getByRole("button", { name: /^북마크 / })).toHaveAttribute(
        "aria-pressed",
        initialBookmark ?? "false"
      );
    } finally {
      await cleanupResource(page, "posts", postId);
    }
  });
});
