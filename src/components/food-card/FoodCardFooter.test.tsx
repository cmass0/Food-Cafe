import { afterEach, describe, expect, test, vi } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { FoodCardReactions } from "./FoodCardFooter";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FoodCardReactions", () => {
  test("반응 수를 다시 그릴 때 숫자 포맷터를 새로 생성하지 않는다", () => {
    const constructor = vi.spyOn(Intl, "NumberFormat");

    const first = renderToStaticMarkup(
      <FoodCardReactions likeCount={1234} bookmarkCount={5678} viewCount={123456} />
    );
    const second = renderToStaticMarkup(
      <FoodCardReactions likeCount={0} bookmarkCount={null} viewCount={undefined} />
    );

    expect(first).toContain("1,234");
    expect(first).toContain("5,678");
    expect(first).toContain("123,456");
    expect(second.match(/>0</g)).toHaveLength(3);
    expect(constructor).not.toHaveBeenCalled();
  });
});
