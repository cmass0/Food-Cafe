// 날짜·시각은 어디서 그리든 한국 시간으로 표시한다. 서버(Vercel, UTC)와 브라우저(한국)가 같은 결과를 내야,
// 한국 시간 자정~오전 9시 사이의 값이 서버에서 하루 전 날짜로 그려졌다가 브라우저에서 바뀌지 않는다.
const DISPLAY_LOCALE = "ko-KR";
const DISPLAY_TIME_ZONE = "Asia/Seoul";
const MAX_CACHED_FORMATTERS = 32;
const formatters = new Map<string, Intl.DateTimeFormat>();

export function formatInKoreanTime(value: Date, options: Intl.DateTimeFormatOptions): string {
  const formatOptions = {
    ...options,
    timeZone: DISPLAY_TIME_ZONE,
  };
  const key = JSON.stringify(formatOptions, Object.keys(formatOptions).sort());
  let formatter = formatters.get(key);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, formatOptions);
    // 표시 옵션이 늘어나도 포맷터가 메모리에 끝없이 쌓이지 않게 제한한다.
    if (formatters.size >= MAX_CACHED_FORMATTERS) {
      const oldestKey = formatters.keys().next().value;
      if (oldestKey !== undefined) formatters.delete(oldestKey);
    }
    formatters.set(key, formatter);
  }

  return formatter.format(value);
}
