import { expect, type Browser, type Page } from "@playwright/test";

import { login } from "./auth";
import type { E2EAccount } from "./environment";

export async function expectOtherUserCannotEdit(
  browser: Browser,
  authorPage: Page,
  otherAccount: E2EAccount,
  detailPath: string,
  editPath: string
): Promise<void> {
  const context = await browser.newContext({ baseURL: new URL(authorPage.url()).origin });
  const page = await context.newPage();

  try {
    await login(page, otherAccount, detailPath);
    await expect(page.getByRole("button", { name: "수정", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "삭제", exact: true })).toHaveCount(0);

    await login(page, otherAccount, editPath);
    await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없습니다" })).toBeVisible();
  } finally {
    await context.close();
  }
}
