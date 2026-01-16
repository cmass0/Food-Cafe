// 객체가 JSON 형태인지 검사
export function isJson(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null;
}
