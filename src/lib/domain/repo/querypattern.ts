// 태그 검색 시 배열 값 이스케이프 처리
export function escapeArrayValue(value: string) {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// 검색 시 입력된 단어에 포함된 % 또는 _ 문자를 이스케이프 처리
export function escapeIlike(term: string): string {
  const str = term.replace(/[%_]/g, (match) => `\\${match}`);
  return `%${str}%`;
}
