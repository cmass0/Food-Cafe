import { expect, type Locator, type Page } from "@playwright/test";

import type { E2EAccount } from "./environment";

const AUTH_DIALOG_NAME = "로그인 또는 회원가입";

export async function expectLoginModal(page: Page): Promise<Locator> {
  const dialog = page.getByRole("dialog", { name: AUTH_DIALOG_NAME });
  await expect(dialog).toBeVisible();
  return dialog;
}

export async function openLoginModal(page: Page): Promise<Locator> {
  await page.goto("/");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  return expectLoginModal(page);
}

export async function loginFromVisibleModal(
  page: Page,
  account: E2EAccount,
  expectedPath: string
): Promise<void> {
  const dialog = await expectLoginModal(page);
  await dialog.getByLabel("이메일", { exact: true }).fill(account.email);
  await dialog.getByLabel("비밀번호", { exact: true }).fill(account.password);
  await dialog.locator("form").getByRole("button", { name: "로그인", exact: true }).click();

  await expect(dialog).toBeHidden();
  await expect
    .poll(() => {
      const current = new URL(page.url());
      return `${current.pathname}${current.search}${current.hash}`;
    })
    .toBe(expectedPath);
}

export async function login(page: Page, account: E2EAccount, next = "/"): Promise<void> {
  await page.goto(`/?auth=login&next=${encodeURIComponent(next)}`);
  await loginFromVisibleModal(page, account, next);
}
