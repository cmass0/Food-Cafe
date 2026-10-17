const formatter = new Intl.NumberFormat("ko-KR");

export function formatKoreanNumber(value: number): string {
  return formatter.format(value);
}
