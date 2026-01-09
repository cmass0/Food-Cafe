// 태그 검색 시 배열 값 이스케이프 처리
export function escapeArrayValue(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// 검색어 허용 범위 지정(한글/영문/숫자/공백)
export function normalizeSearchTerm(value: string): string {
  return value.replace(/[^가-힣a-zA-Z0-9\s]/g, "").trim();
}
