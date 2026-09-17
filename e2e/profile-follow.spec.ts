import { expect, test } from "@playwright/test";

import { expectLoginModal, login } from "./support/auth";
import {
  AUTHOR_ACCOUNT,
  MUTATING_E2E_ENABLED,
  OTHER_USER_ID,
} from "./support/environment";

test.describe("공개 프로필과 팔로우", () => {
  test("공개 프로필은 팔로워·팔로잉 목록과 공개 콘텐츠만 제공한다", async ({ page }) => {
    test.skip(!OTHER_USER_ID, "E2E_OTHER_USER_ID가 필요합니다.");
    if (!OTHER_USER_ID) return;

    await page.goto(`/profile/${OTHER_USER_ID}`);

    await expect(page.getByRole("button", { name: /^팔로워 .*목록 보기$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^팔로잉 .*목록 보기$/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: "북마크" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "좋아요" })).toHaveCount(0);

    await page.getByRole("button", { name: /^팔로워 .*목록 보기$/ }).click();
    const dialog = page.getByRole("dialog", { name: "팔로워" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("사용자를 선택하면 해당 프로필로 이동합니다.")).toBeVisible();
  });

  test("비로그인 팔로우는 수치를 바꾸지 않고 로그인 모달을 연다", async ({ page }) => {
    test.skip(!OTHER_USER_ID, "E2E_OTHER_USER_ID가 필요합니다.");
    if (!OTHER_USER_ID) return;

    await page.goto(`/profile/${OTHER_USER_ID}`);
    const followerButton = page.getByRole("button", { name: /^팔로워 .*목록 보기$/ });
    const countBefore = await followerButton.getAttribute("aria-label");

    await page.getByRole("button", { name: "팔로우", exact: true }).click();

    await expectLoginModal(page);
    await expect(followerButton).toHaveAttribute("aria-label", countBefore ?? "");
  });

  test("로그인 사용자의 팔로우 상태는 새로고침 후 유지되고 원상복구된다", async ({ page }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !OTHER_USER_ID || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자·대상 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT || !OTHER_USER_ID) return;

    const targetPath = `/profile/${OTHER_USER_ID}`;
    await login(page, AUTHOR_ACCOUNT, targetPath);

    const initialFollowing = await page
      .getByRole("button", { name: /^(팔로우|언팔로우)$/ })
      .textContent();
    const expectedNext = initialFollowing?.trim() === "언팔로우" ? "팔로우" : "언팔로우";

    await page.getByRole("button", { name: initialFollowing?.trim() ?? "팔로우" }).click();
    await expect(page.getByRole("button", { name: expectedNext })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: expectedNext })).toBeVisible();

    await page.getByRole("button", { name: expectedNext }).click();
    await expect(
      page.getByRole("button", { name: initialFollowing?.trim() ?? "팔로우" })
    ).toBeVisible();
  });
});
