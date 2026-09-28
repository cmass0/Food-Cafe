import { expect, test } from "@playwright/test";

import { login, loginFromVisibleModal } from "./support/auth";
import { AUTHOR_ACCOUNT, MUTATING_E2E_ENABLED, RESET_ACCOUNT } from "./support/environment";
import { clearMailbox, restorePassword, waitForAuthLink } from "./support/mailbox";

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

  test("메일 링크로 새 비밀번호를 저장하면 새 비밀번호로 로그인되고, 같은 링크는 다시 쓸 수 없다", async ({
    page,
  }) => {
    test.skip(
      !RESET_ACCOUNT || !MUTATING_E2E_ENABLED,
      "로컬 Supabase의 E2E_RESET_EMAIL/PASSWORD와 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!RESET_ACCOUNT) return;

    const newPassword = `Reset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // 메일 서버 시각과 약간 어긋나도 이번 요청 메일을 찾도록 여유를 둔다.
    const requestedAt = new Date(Date.now() - 5_000);
    await clearMailbox(RESET_ACCOUNT.email);

    let scenarioFailed = false;
    try {
      await page.goto("/auth/recovery");
      await page.getByPlaceholder("가입한 이메일 입력").fill(RESET_ACCOUNT.email);
      await page.getByRole("button", { name: "변경 링크 전송하기" }).click();
      await expect(page.getByText("입력한 이메일로 가입된 계정이 있다면")).toBeVisible();

      const link = await waitForAuthLink(RESET_ACCOUNT.email, requestedAt);
      await page.goto(link);
      await expect(page).toHaveURL(/\/auth\/recovery\/reset$/);

      await page.getByLabel("새 비밀번호", { exact: true }).fill(newPassword);
      await page.getByLabel("새 비밀번호 확인", { exact: true }).fill(newPassword);
      await page.getByRole("button", { name: "비밀번호 변경하기" }).click();
      // 저장 뒤에는 로그아웃된 채 홈으로 이동하고, 로그인 모달이 변경 완료 안내와 함께 열린다.
      const loginDialog = page.getByRole("dialog", { name: "로그인 또는 회원가입" });
      await expect(loginDialog.getByRole("status")).toHaveText(
        "비밀번호가 변경되었습니다. 새 비밀번호로 로그인해 주세요."
      );

      await loginFromVisibleModal(page, { email: RESET_ACCOUNT.email, password: newPassword }, "/");

      await page.goto(link);
      await expect(page).toHaveURL(/\/auth\/recovery\?error=invalid-link/);
      await expect(
        page.getByRole("alert").filter({ hasText: "만료되었거나 이미 사용되었습니다" })
      ).toBeVisible();
    } catch (error) {
      scenarioFailed = true;
      throw error;
    } finally {
      try {
        await restorePassword(RESET_ACCOUNT.email, RESET_ACCOUNT.password);
      } catch (restoreError) {
        // 본 시나리오가 이미 실패했다면 그 원인을 가리지 않도록 복원 실패는 기록만 한다.
        if (!scenarioFailed) throw restoreError;
        console.error("E2E_RESET 계정 비밀번호 복원 실패", restoreError);
      }
    }
  });
});
