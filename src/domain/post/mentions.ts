import { z } from "zod";

const mentionIdSchema = z.string().uuid();
/** 게시글 하나에 멘션할 수 있는 서로 다른 사용자 수의 상한. */
export const MAX_UNIQUE_MENTIONS = 20;

/** 멘션 오류 문구는 여기서만 정의한다. 화면 계층이 문자열을 다시 적으면 값이 바뀔 때 어긋난다. */
export const INVALID_MENTION_MESSAGE = "유효하지 않은 멘션이 포함되어 있습니다.";
export const MENTION_LIMIT_MESSAGE = `한 게시글에는 최대 ${MAX_UNIQUE_MENTIONS}명까지 멘션할 수 있습니다.`;

/** 게시글 JSON에서 알림 대상으로 사용할 수 있는 실제 사용자 멘션 ID만 수집한다. */
export function collectMentionTargetIds(value: unknown): string[] {
  const ids = new Set<string>();

  function visit(nodeValue: unknown): void {
    if (Array.isArray(nodeValue)) {
      for (const item of nodeValue) visit(item);
      return;
    }
    if (!nodeValue || typeof nodeValue !== "object") return;

    const node = nodeValue as Record<string, unknown>;
    if (node.type === "mention" && node.mentionId != null) {
      const parsedId = mentionIdSchema.safeParse(node.mentionId);
      if (!parsedId.success) {
        throw new Error(INVALID_MENTION_MESSAGE);
      }
      ids.add(parsedId.data);
      if (ids.size > MAX_UNIQUE_MENTIONS) {
        throw new Error(MENTION_LIMIT_MESSAGE);
      }
    }

    for (const child of Object.values(node)) visit(child);
  }

  visit(value);
  return [...ids];
}
