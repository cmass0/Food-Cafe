import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { formatInKoreanTime } from "./format-date";

// 한국 시간 2026-09-30 03:00. UTC로는 아직 9월 29일이다.
const EARLY_MORNING_KST = new Date("2026-09-29T18:00:00Z");
const originalTimeZone = process.env.TZ;

// 배포 서버처럼 UTC에서 돌려야 시간대를 빠뜨렸을 때 테스트가 실패한다.
beforeAll(() => {
  process.env.TZ = "UTC";
});

// process.env에 undefined를 넣으면 문자열 "undefined"가 들어가므로, 원래 없던 값은 지운다.
afterAll(() => {
  if (originalTimeZone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimeZone;
});

describe("formatInKoreanTime", () => {
  test("테스트 환경은 UTC로 날짜를 계산한다", () => {
    expect(EARLY_MORNING_KST.toLocaleDateString("ko-KR", { day: "numeric" })).toBe("29일");
  });

  test("UTC로 전날인 시각도 한국 날짜로 표시한다", () => {
    expect(
      formatInKoreanTime(EARLY_MORNING_KST, { year: "numeric", month: "long", day: "numeric" })
    ).toBe("2026년 9월 30일");
  });

  test("시각도 한국 시간으로 표시한다", () => {
    expect(
      formatInKoreanTime(EARLY_MORNING_KST, {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
    ).toBe("03:00");
  });

  test("부른 쪽이 다른 시간대를 넘겨도 한국 시간을 쓴다", () => {
    expect(formatInKoreanTime(EARLY_MORNING_KST, { day: "numeric", timeZone: "UTC" })).toBe("30일");
  });
});
