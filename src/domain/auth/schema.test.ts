import { describe, expect, test } from "vitest";

import {
  KoreanMobilePhoneSchema,
  PasswordChangeSchema,
  PasswordResetCompleteSchema,
  PhoneOtpVerifySchema,
} from "./schema";

describe("한국 휴대폰 번호", () => {
  test.each([
    ["010-1234-5678", "+821012345678"],
    ["010 1234 5678", "+821012345678"],
    ["+82 (0)10-1234-5678", "+821012345678"],
    ["821012345678", "+821012345678"],
  ] as const)("%s을 국제 번호 %s로 정규화한다", (input, expected) => {
    expect(KoreanMobilePhoneSchema.parse(input)).toBe(expected);
  });

  test.each(["", "   ", "02-1234-5678", "010-123-4567", "010-1234-56789"])(
    "%s은 휴대폰 번호로 거부한다",
    (input) => {
      expect(KoreanMobilePhoneSchema.safeParse(input).success).toBe(false);
    }
  );
});

describe("비밀번호 확인", () => {
  test.each([
    ["비밀번호 변경", PasswordChangeSchema, { currentPassword: "old", newPassword: "new" }],
    ["비밀번호 재설정", PasswordResetCompleteSchema, { newPassword: "new" }],
  ] as const)("%s에서 확인값이 다르면 confirmPassword 오류를 반환한다", (_label, schema, base) => {
    const result = schema.safeParse({ ...base, confirmPassword: "other" });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(true);
  });
});

describe("휴대폰 인증번호", () => {
  test("숫자 6자리를 허용하고 바깥 공백을 제거한다", () => {
    const result = PhoneOtpVerifySchema.parse({ phone: "010-1234-5678", token: " 123456 " });

    expect(result).toEqual({ phone: "+821012345678", token: "123456" });
  });

  test.each(["12345", "1234567", "12a456", "      "])("인증번호 %s은 거부한다", (token) => {
    const result = PhoneOtpVerifySchema.safeParse({ phone: "010-1234-5678", token });

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === "token")).toBe(true);
  });
});
