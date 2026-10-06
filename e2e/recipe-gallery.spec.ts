import { expect, test } from "@playwright/test";

import { login } from "./support/auth";
import { AUTHOR_ACCOUNT, MUTATING_E2E_ENABLED, uniqueTitle } from "./support/environment";
import { createRecipeThroughUi } from "./support/forms";
import { cleanupResource, resourceIdFromPage } from "./support/resources";

// 넓은 화면은 작은 사진 4장이 한 줄에 보인다. 넘기기 버튼이 생기도록 그보다 많이 올린다.
const IMAGE_COUNT = 6;

test.describe("레시피 상세 사진 캐러셀", () => {
  test("작은 사진을 누르면 큰 사진과 순서 표시가 바뀌고, 넘기기 버튼은 넘길 사진이 있을 때만 보인다", async ({
    page,
  }) => {
    test.skip(
      !AUTHOR_ACCOUNT || !MUTATING_E2E_ENABLED,
      "격리 DB의 작성자 계정과 E2E_ENABLE_MUTATIONS=true가 필요합니다."
    );
    if (!AUTHOR_ACCOUNT) return;

    let recipeId: string | null = null;
    const title = uniqueTitle("사진 캐러셀");

    await login(page, AUTHOR_ACCOUNT);
    try {
      await createRecipeThroughUi(page, title, IMAGE_COUNT);
      recipeId = resourceIdFromPage(page, "recipes");

      const thumbnail = (order: number) =>
        page.getByRole("button", { name: `${order}번째 사진 보기` });
      const previous = page.getByRole("button", { name: "이전 사진들" });
      const next = page.getByRole("button", { name: "다음 사진들" });

      await expect(page.getByText(`1 / ${IMAGE_COUNT}`)).toBeVisible();
      await expect(thumbnail(1)).toHaveAttribute("aria-current", "true");
      await expect(previous).toHaveCount(0);
      await expect(next).toBeVisible();

      await thumbnail(3).click();
      await expect(page.getByText(`3 / ${IMAGE_COUNT}`)).toBeVisible();
      await expect(thumbnail(3)).toHaveAttribute("aria-current", "true");
      await expect(thumbnail(1)).not.toHaveAttribute("aria-current", "true");
      await expect(page.getByRole("img", { name: `${title} 사진 3` })).toBeVisible();

      await next.click();
      await expect(previous).toBeVisible();
      await expect(next).toHaveCount(0);

      await previous.click();
      await expect(previous).toHaveCount(0);
      await expect(next).toBeVisible();
    } finally {
      await cleanupResource(page, "recipes", recipeId);
    }
  });
});
