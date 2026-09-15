import { describe, expect, test } from "vitest";

import { toActionErrorMessage } from "@/lib/api/action-error";
import { MAX_UNIQUE_MENTIONS, collectMentionTargetIds } from "./mentions";
import { POST_USER_FACING_ERRORS } from "./messages";

function mentionNodes(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    type: "mention",
    mentionId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  }));
}

function thrownMessage(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
  throw new Error("오류가 발생하지 않았습니다.");
}

describe("게시글 사용자 노출 오류 목록", () => {
  // 상한 문구는 MAX_UNIQUE_MENTIONS로 조립되므로 목록에 문자열을 다시 적으면 값이 바뀔 때 어긋난다.
  test("멘션 상한 오류가 허용 목록에 실제로 들어 있다", () => {
    const message = thrownMessage(() =>
      collectMentionTargetIds(mentionNodes(MAX_UNIQUE_MENTIONS + 1))
    );

    expect(POST_USER_FACING_ERRORS.has(message)).toBe(true);
  });

  test("멘션 형식 오류가 허용 목록에 실제로 들어 있다", () => {
    const message = thrownMessage(() =>
      collectMentionTargetIds({ type: "mention", mentionId: "not-a-uuid" })
    );

    expect(POST_USER_FACING_ERRORS.has(message)).toBe(true);
  });

  test("상한을 넘기면 일반 안내가 아니라 구체적인 문구가 사용자에게 간다", () => {
    const error = (() => {
      try {
        collectMentionTargetIds(mentionNodes(MAX_UNIQUE_MENTIONS + 1));
      } catch (caught) {
        return caught;
      }
    })();

    const shown = toActionErrorMessage(error, POST_USER_FACING_ERRORS);

    expect(shown).toContain(String(MAX_UNIQUE_MENTIONS));
    expect(shown).toContain("멘션");
  });
});
