/**
 * 트렌드 집계 기간.
 * label은 화면에 노출하는 이름, windowLabel은 실제 조회 기준이다.
 * windowLabel은 private.trending_window_start()의 interval과 반드시 일치해야 한다.
 */
export const TRENDING_PERIOD_OPTIONS = [
  { value: "day", label: "일간", windowLabel: "최근 24시간" },
  { value: "week", label: "주간", windowLabel: "최근 7일" },
  { value: "month", label: "월간", windowLabel: "최근 1개월" },
] as const;

export type TrendingPeriod = (typeof TRENDING_PERIOD_OPTIONS)[number]["value"];

export const DEFAULT_TRENDING_PERIOD: TrendingPeriod = "week";

export function isTrendingPeriod(value: string | null | undefined): value is TrendingPeriod {
  return TRENDING_PERIOD_OPTIONS.some((option) => option.value === value);
}

export function parseTrendingPeriod(value: string | null | undefined): TrendingPeriod {
  return isTrendingPeriod(value) ? value : DEFAULT_TRENDING_PERIOD;
}

function findOption(period: TrendingPeriod) {
  return (
    TRENDING_PERIOD_OPTIONS.find((option) => option.value === period) ?? TRENDING_PERIOD_OPTIONS[1]
  );
}

/** 집계 기준을 명시하는 문구 (예: 최근 7일) */
export function trendingWindowLabel(period: TrendingPeriod): string {
  return findOption(period).windowLabel;
}
