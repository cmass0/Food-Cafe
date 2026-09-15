import { describe, expect, test } from "vitest";

import {
  DEFAULT_TRENDING_PERIOD,
  isTrendingPeriod,
  parseTrendingPeriod,
  trendingWindowLabel,
} from "./period";

describe("트렌딩 기간", () => {
  test.each([
    ["day", "최근 24시간"],
    ["week", "최근 7일"],
    ["month", "최근 1개월"],
  ] as const)("%s 기간과 집계 기준 문구를 반환한다", (period, label) => {
    expect(isTrendingPeriod(period)).toBe(true);
    expect(parseTrendingPeriod(period)).toBe(period);
    expect(trendingWindowLabel(period)).toBe(label);
  });

  test("알 수 없거나 비어 있는 기간은 기본값을 사용한다", () => {
    expect(parseTrendingPeriod("year")).toBe(DEFAULT_TRENDING_PERIOD);
    expect(parseTrendingPeriod(undefined)).toBe(DEFAULT_TRENDING_PERIOD);
  });
});
