/** 좋아요·북마크·팔로우 요청 본문에서 원하는 상태를 담는 필드 이름. */
export type RelationStateField = "liked" | "bookmarked" | "following";

/**
 * 요청 본문에서 원하는 관계 상태(true/false)를 읽는다.
 * 토글이 아니라 상태를 지정하므로 같은 요청을 반복해도 결과가 같다.
 * 본문이 JSON이 아니거나 값이 boolean이 아니면 null을 반환한다.
 */
export async function readRelationState(
  req: Request,
  field: RelationStateField
): Promise<boolean | null> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return null;
  }

  if (typeof body !== "object" || body === null) return null;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === "boolean" ? value : null;
}
