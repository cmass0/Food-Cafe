// 날짜·시각은 어디서 그리든 한국 시간으로 표시한다. 서버(Vercel, UTC)와 브라우저(한국)가 같은 결과를 내야,
// 한국 시간 자정~오전 9시 사이의 값이 서버에서 하루 전 날짜로 그려졌다가 브라우저에서 바뀌지 않는다.
const DISPLAY_LOCALE = "ko-KR";
const DISPLAY_TIME_ZONE = "Asia/Seoul";

export function formatInKoreanTime(value: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(DISPLAY_LOCALE, {
    ...options,
    timeZone: DISPLAY_TIME_ZONE,
  }).format(value);
}
