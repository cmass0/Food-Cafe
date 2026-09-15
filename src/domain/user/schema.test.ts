import { describe, expect, test } from "vitest";

import { UserUpdateSchema } from "./schema";

describe("사용자 프로필 입력", () => {
  test("표시 이름 바깥 공백을 제거한다", () => {
    expect(UserUpdateSchema.parse({ display_name: "  홍길동  " })).toEqual({
      display_name: "홍길동",
    });
  });

  test.each([
    ["공백 이름", { display_name: "   " }, "display_name"],
    ["41자 이름", { display_name: "가".repeat(41) }, "display_name"],
    ["상대 경로 탈출", { photo_url: "../avatars/user/a.png" }, "photo_url"],
    ["지원하지 않는 URL", { photo_url: "javascript:alert(1)" }, "photo_url"],
  ] as const)("%s은 %s 오류로 거부한다", (_label, input, field) => {
    const result = UserUpdateSchema.safeParse(input);

    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.some((issue) => issue.path[0] === field)).toBe(true);
  });

  test.each([
    ["관리 Storage 경로", "avatars/user-1/avatar.png"],
    ["HTTPS 외부 URL", "https://example.com/avatar.png"],
    ["HTTP 외부 URL", "http://example.com/avatar.png"],
    ["이미지 제거", null],
  ] as const)("%s 프로필 이미지를 허용한다", (_label, photoUrl) => {
    expect(UserUpdateSchema.safeParse({ photo_url: photoUrl }).success).toBe(true);
  });
});
