import { describe, expect, test } from "vitest";

import { collectMentionTargetIds, MAX_UNIQUE_MENTIONS } from "./mentions";

const USER_A = "00000000-0000-4000-8000-000000000001";
const USER_B = "00000000-0000-4000-8000-000000000002";

describe("collectMentionTargetIds", () => {
  test("중첩된 게시글 JSON에서 유효한 멘션 ID를 중복 없이 모은다", () => {
    const content = {
      root: {
        children: [
          { type: "paragraph", children: [{ type: "mention", mentionId: USER_A }] },
          { type: "mention", mentionId: USER_A },
          { type: "mention", mentionId: USER_B },
        ],
      },
    };

    expect(collectMentionTargetIds(content)).toEqual([USER_A, USER_B]);
  });

  test("유효하지 않은 사용자 ID가 포함되면 거부한다", () => {
    expect(() => collectMentionTargetIds({ type: "mention", mentionId: "not-a-uuid" })).toThrow(
      "유효하지 않은 멘션이 포함되어 있습니다."
    );
  });

  test("서로 다른 멘션이 20명을 초과하면 거부한다", () => {
    const mentions = Array.from({ length: 21 }, (_, index) => ({
      type: "mention",
      mentionId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    }));

    expect(() => collectMentionTargetIds(mentions)).toThrow(
      "한 게시글에는 최대 20명까지 멘션할 수 있습니다."
    );
  });

  test("서로 다른 멘션을 정확히 20명까지 허용한다", () => {
    const mentions = Array.from({ length: MAX_UNIQUE_MENTIONS }, (_, index) => ({
      type: "mention",
      mentionId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
    }));

    expect(collectMentionTargetIds(mentions)).toHaveLength(MAX_UNIQUE_MENTIONS);
  });

  test.each([
    ["없는 값", undefined],
    ["null", null],
    ["빈 배열", []],
    ["멘션이 없는 객체", { type: "paragraph", children: [] }],
  ] as const)("%s에서는 멘션을 수집하지 않는다", (_label, value) => {
    expect(collectMentionTargetIds(value)).toEqual([]);
  });

  test("같은 사용자가 21번 등장해도 한 명으로 계산한다", () => {
    const mentions = Array.from({ length: 21 }, () => ({
      type: "mention",
      mentionId: USER_A,
    }));

    expect(collectMentionTargetIds(mentions)).toEqual([USER_A]);
  });
});
