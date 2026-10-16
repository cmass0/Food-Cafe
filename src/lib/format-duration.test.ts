import { describe, expect, test } from "vitest";

import { formatMinutes } from "./format-duration";

describe("formatMinutes", () => {
  test.each([
    [59, "59분"],
    [60, "1시간"],
    [61, "1시간 1분"],
    [150, "2시간 30분"],
  ] as const)("%s분은 %s로 보여준다", (value, expected) => {
    expect(formatMinutes(value)).toBe(expected);
  });
  test.each([[0], [-5], [null], [undefined]] as const)("%s이면 보여줄 시간이 없다", (value) => {
    expect(formatMinutes(value)).toBeNull();
  });
});
