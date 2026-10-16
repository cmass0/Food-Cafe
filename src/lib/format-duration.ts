// 분 단위 시간을 "1시간 30분"처럼 읽기 쉬운 글로 바꾼다. 값이 없거나 0 이하이면 null.
export function formatMinutes(value: number | null | undefined) {
  if (!value || value <= 0) return null;
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours && minutes) return `${hours}시간 ${minutes}분`;
  if (hours) return `${hours}시간`;
  return `${minutes}분`;
}
