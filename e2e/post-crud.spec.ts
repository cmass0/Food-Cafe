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

  test("에디터에서 넣은 서식이 상세 화면에도 그대로 보인다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let postId: string | null = null;
    await login(page, AUTHOR_ACCOUNT);
    try {
      await page.goto("/posts/new");
      await page.getByLabel("제목").fill(uniqueTitle("서식 게시글"));
      // 사용자가 치듯 마크다운 단축 입력으로 서식을 넣는다(붙여 넣기는 단축 입력이 동작하지 않는다).
      // 프로덕션 빌드는 이전 화면을 숨긴 채 남겨 둘 때가 있어, 보이는 에디터만 고른다.
      await page.locator('[contenteditable="true"]').filter({ visible: true }).click();
      await page.keyboard.type("## 소제목");
      await page.keyboard.press("Enter");
      await page.keyboard.type("> 인용문");
      await page.keyboard.press("Enter");
      await page.keyboard.press("Enter");
      await page.keyboard.type("**굵게** 쓴 문장");
      await page.keyboard.press("Enter");
      await page.keyboard.type("- 목록 항목");
      await page.getByRole("button", { name: "등록", exact: true }).click();
      await expect(page).toHaveURL(/\/posts\/[0-9a-f-]{36}$/);
      postId = resourceIdFromPage(page, "posts");

      const body = page.locator(".post-content");
      await expect(body.locator("h2")).toHaveText("소제목");
      await expect(body.locator("blockquote")).toHaveText("인용문");
      await expect(body.locator("strong")).toHaveText("굵게");
      await expect(body.locator("ul > li")).toHaveText("목록 항목");
    } finally {
      await cleanupResource(page, "posts", postId);
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

    const candidateGroup = page.getByText("내 팔로잉", { exact: true });
    const retryButton = page.getByRole("button", { name: "다시 시도", exact: true });
    await expect(candidateGroup.or(retryButton)).toBeVisible();
    if (await retryButton.isVisible()) {
      await retryButton.click();
    }

    await expect(candidateGroup).toBeVisible();
    await expect(page.getByText(MENTION_EXPECTED_NAME, { exact: true })).toBeVisible();
  });
});
