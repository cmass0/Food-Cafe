import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from "vitest";

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

afterEach(() => {
  vi.restoreAllMocks();
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

  test.each([
    ["한국 시간 새해 직전", "2026-12-31T14:59:59Z", "2026년 12월 31일"],
    ["한국 시간 새해 시작", "2026-12-31T15:00:00Z", "2027년 1월 1일"],
  ] as const)("%s에도 해당 한국 날짜를 표시한다", (_label, value, expected) => {
    expect(
      formatInKoreanTime(new Date(value), { year: "numeric", month: "long", day: "numeric" })
    ).toBe(expected);
  });

  test("연도와 월일 표시를 번갈아 호출해도 각 표시 옵션을 유지한다", () => {
    expect(formatInKoreanTime(EARLY_MORNING_KST, { year: "numeric" })).toBe("2026년");
    expect(formatInKoreanTime(EARLY_MORNING_KST, { month: "long", day: "numeric" })).toBe(
      "9월 30일"
    );
    expect(formatInKoreanTime(new Date("2027-01-01T00:00:00Z"), { year: "numeric" })).toBe(
      "2027년"
    );
  });

  test("같은 표시 옵션은 속성 순서가 달라도 포맷터를 중복 생성하지 않는다", async () => {
    vi.resetModules();
    const { formatInKoreanTime: format } = await import("./format-date");
    const constructor = vi.spyOn(Intl, "DateTimeFormat");

    expect(format(EARLY_MORNING_KST, { month: "long", day: "numeric" })).toBe("9월 30일");
    expect(format(new Date("2026-10-01T00:00:00Z"), { day: "numeric", month: "long" })).toBe(
      "10월 1일"
    );
    expect(format(EARLY_MORNING_KST, { month: "long", day: "numeric" })).toBe("9월 30일");
    expect(constructor.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
