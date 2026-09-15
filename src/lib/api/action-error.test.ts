import { describe, expect, test } from "vitest";
import { z } from "zod";

import { DEFAULT_ACTION_ERROR, toActionErrorMessage } from "./action-error";

const USER_FACING = new Set(["제목을 입력해 주세요."]);

function zodErrorOf(message: string) {
  return z.string().min(5, message).safeParse("ab").error!;
}

describe("toActionErrorMessage", () => {
  test("Zod 검증 오류는 첫 번째 안내 문구를 그대로 보여준다", () => {
    expect(toActionErrorMessage(zodErrorOf("다섯 글자 이상 입력해 주세요."), USER_FACING)).toBe(
      "다섯 글자 이상 입력해 주세요."
    );
  });

  test("허용 목록에 있는 오류는 문구를 그대로 보여준다", () => {
    expect(toActionErrorMessage(new Error("제목을 입력해 주세요."), USER_FACING)).toBe(
      "제목을 입력해 주세요."
    );
  });

  test("허용 목록에 없는 오류는 내부 내용을 감춘다", () => {
    const internal = new Error('relation "public.posts" does not exist');

    expect(toActionErrorMessage(internal, USER_FACING)).toBe(DEFAULT_ACTION_ERROR);
  });

  test.each([null, undefined, "문자열로 던진 오류", 500, { message: "제목을 입력해 주세요." }])(
    "Error가 아닌 %s를 던져도 기본 문구로 대체한다",
    (thrown) => {
      expect(toActionErrorMessage(thrown, USER_FACING)).toBe(DEFAULT_ACTION_ERROR);
    }
  );

  test("허용 목록이 비어 있으면 어떤 오류도 노출하지 않는다", () => {
    expect(toActionErrorMessage(new Error("제목을 입력해 주세요."), new Set())).toBe(
      DEFAULT_ACTION_ERROR
    );
  });
});
