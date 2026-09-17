import { expect, test } from "@playwright/test";

import { login } from "./support/auth";
import { AUTHOR_ACCOUNT } from "./support/environment";

test.describe("계정 관리", () => {
  test("계정 찾기 화면에서 이메일·비밀번호 복구 방법을 전환한다", async ({ page }) => {
    await page.goto("/auth/recovery");

    await expect(page.getByRole("heading", { name: "계정 찾기" })).toBeVisible();
    await expect(page.getByPlaceholder("가입한 이메일 입력")).toBeVisible();

    await page.getByRole("tab", { name: "이메일 찾기" }).click();
    await expect(page.getByPlaceholder("010-1234-5678")).toBeVisible();
  });

  test("만료된 비밀번호 링크는 다시 요청할 수 있는 오류로 안내한다", async ({ page }) => {
    await page.goto("/auth/recovery?error=invalid-link");

    await expect(page.getByRole("alert")).toContainText("만료되었거나 이미 사용되었습니다");
    await expect(page.getByRole("button", { name: "변경 링크 전송하기" })).toBeVisible();
  });

  test("로그인 사용자는 프로필 편집 시트에서 계정 관리 항목을 확인한다", async ({ page }) => {
    test.skip(!AUTHOR_ACCOUNT, "E2E_AUTHOR_EMAIL/PASSWORD가 필요합니다.");
    if (!AUTHOR_ACCOUNT) return;

    await login(page, AUTHOR_ACCOUNT, "/profile");
    await page.getByRole("button", { name: "내 정보 수정" }).click();

    const sheet = page.getByRole("dialog", { name: "내 정보 수정" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "이메일 변경" })).toBeVisible();
    await expect(sheet.getByRole("heading", { name: "비밀번호 변경" })).toBeVisible();
    await expect(sheet.getByRole("button", { name: "계정 삭제", exact: true })).toBeVisible();
  });
});
