import { expect, test } from "@playwright/test";

import { login } from "./support/auth";
import { AUTHOR_ACCOUNT, MUTATING_E2E_ENABLED, uniqueTitle } from "./support/environment";
import { createPostThroughUi, createRecipeThroughUi } from "./support/forms";
import { cleanupResource, resourceIdFromPage } from "./support/resources";

test.describe("콘텐츠 공유", () => {
  test("URL 복사는 현재 레시피 링크를 클립보드에 기록한다", async ({ context, page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let recipeId: string | null = null;
    await login(page, AUTHOR_ACCOUNT);
    try {
      await createRecipeThroughUi(page, uniqueTitle("URL 공유 레시피"));
      recipeId = resourceIdFromPage(page, "recipes");

      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const copyButton = page.getByRole("button", { name: "URL 복사" });
      await copyButton.click();

      await expect(page.getByRole("button", { name: "URL 복사 완료" })).toBeVisible();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      expect(copied).toContain(`/recipes/${recipeId}`);
    } finally {
      await cleanupResource(page, "recipes", recipeId);
    }
  });

  test("카카오 SDK를 불러오지 못하면 공용 오류 모달과 URL 복사를 제공한다", async ({
    context,
    page,
  }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let recipeId: string | null = null;
    await login(page, AUTHOR_ACCOUNT);
    try {
      await createRecipeThroughUi(page, uniqueTitle("카카오 공유 레시피"));
      recipeId = resourceIdFromPage(page, "recipes");

      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      await page.route("https://t1.kakaocdn.net/**", (route) => route.abort());
      // 레시피 생성 후 도착한 상세 화면에서는 SDK가 이미 로드됐을 수 있으므로,
      // 차단 규칙을 등록한 상태에서 문서를 새로 불러와 로딩 실패를 재현합니다.
      await page.reload();

      const shareButton = page.getByRole("button", { name: "카카오톡으로 공유" });
      await expect(shareButton).toBeEnabled();
      await shareButton.click();

      const dialog = page.getByRole("alertdialog", { name: "카카오 공유를 사용할 수 없습니다" });
      await expect(
        dialog.getByRole("heading", { name: "카카오 공유를 사용할 수 없습니다" })
      ).toBeVisible();
      await dialog.getByRole("button", { name: "URL 복사" }).click();
      await expect(dialog.getByRole("button", { name: "복사 완료" })).toBeVisible();
    } finally {
      await cleanupResource(page, "recipes", recipeId);
    }
  });

  test("게시글 상세에는 공유 기능을 노출하지 않는다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let postId: string | null = null;
    await login(page, AUTHOR_ACCOUNT);
    try {
      await createPostThroughUi(page, uniqueTitle("공유 미노출 게시글"));
      postId = resourceIdFromPage(page, "posts");

      await expect(page.getByRole("button", { name: /카카오톡으로 공유|URL 복사/ })).toHaveCount(0);
    } finally {
      await cleanupResource(page, "posts", postId);
    }
  });
});
