import { describe, expect, test } from "vitest";

import { resolveLimit, resolveOffset } from "./pagination";

describe("resolveLimit", () => {
  test("값이 없거나 숫자가 아니면 기본값을 사용한다", () => {
    expect(resolveLimit()).toBe(20);
    expect(resolveLimit(Number.NaN, 12)).toBe(12);
  });

  test("소수는 버리고 허용 범위 안으로 제한한다", () => {
    expect(resolveLimit(7.9)).toBe(7);
    expect(resolveLimit(0)).toBe(1);
    expect(resolveLimit(100, 20, 50)).toBe(50);
  });
});

describe("resolveOffset", () => {
  test("페이지 번호를 조회 시작 위치로 바꾼다", () => {
    expect(resolveOffset(1, 20)).toBe(0);
    expect(resolveOffset(3, 20)).toBe(40);
    expect(resolveOffset(2.9, 10)).toBe(10);
  });

  test("유효하지 않거나 1보다 작은 페이지는 첫 페이지로 처리한다", () => {
    expect(resolveOffset(undefined, 20)).toBe(0);
    expect(resolveOffset(Number.POSITIVE_INFINITY, 20)).toBe(0);
    expect(resolveOffset(-3, 20)).toBe(0);
  });
});
