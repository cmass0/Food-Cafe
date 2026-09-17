import path from "node:path";

import { expect, type Page } from "@playwright/test";

const TEST_IMAGE_PATH = path.resolve("src/app/favicon.png");

export async function createRecipeThroughUi(page: Page, title: string): Promise<void> {
  await page.goto("/recipes/new");
  await expect(page.getByRole("heading", { name: "레시피 등록" })).toBeVisible();

  await page.getByLabel("레시피 제목").fill(title);
  await page.getByLabel("레시피 이미지").setInputFiles(TEST_IMAGE_PATH);
  await page.getByLabel("재료명").fill("테스트 재료");
  await page.getByLabel("용량").fill("1");
  await page
    .getByPlaceholder("이 단계에서 해야 할 일을 구체적으로 적어 주세요.")
    .fill("테스트 조리 단계를 수행합니다.");
  await page.getByRole("button", { name: "등록", exact: true }).click();
  await expect(page).toHaveURL(/\/recipes\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

export async function createComboThroughUi(page: Page, title: string): Promise<void> {
  await page.goto("/combos/new");
  await expect(page.getByRole("heading", { name: "조합 작성" })).toBeVisible();

  await page.getByLabel("조합 제목").fill(title);
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "쉬움", exact: true }).click();
  await page.getByLabel(/소요 시간/).fill("10");
  await page.getByLabel("대표 이미지").setInputFiles(TEST_IMAGE_PATH);

  await page.getByRole("button", { name: "항목 추가", exact: true }).click();
  await page.getByRole("button", { name: "항목 추가", exact: true }).click();
  await page.getByLabel("상품 1 이름").fill("테스트 상품 A");
  await page.getByLabel("상품 2 이름").fill("테스트 상품 B");
  await page
    .getByPlaceholder("이 단계에서 해야 할 일을 구체적으로 적어 주세요.")
    .fill("두 상품을 함께 준비합니다.");

  await page.getByRole("button", { name: "등록", exact: true }).click();
  await expect(page).toHaveURL(/\/combos\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

export async function createPostThroughUi(page: Page, title: string): Promise<void> {
  await page.goto("/posts/new");
  await expect(page.getByRole("heading", { name: "게시글 작성" })).toBeVisible();

  await page.getByLabel("제목").fill(title);
  await page.locator('[contenteditable="true"]').fill("Playwright E2E 테스트 게시글입니다.");
  await page.getByRole("button", { name: "등록", exact: true }).click();
  await expect(page).toHaveURL(/\/posts\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}
