import { describe, expect, test } from "vitest";

import { resolveRequestOrigin } from "./request-origin";

function headersOf(values: Record<string, string>): Headers {
  return new Headers(values);
}

describe("resolveRequestOrigin", () => {
  test("브라우저가 요청한 host가 req.url과 다르면 요청한 host를 쓴다", () => {
    expect(
      resolveRequestOrigin(
        "http://localhost:3100/auth/callback?code=x",
        headersOf({ host: "127.0.0.1:3100" })
      )
    ).toBe("http://127.0.0.1:3100");
  });

  test("프록시가 넘긴 x-forwarded-host·proto를 host 헤더보다 먼저 쓴다", () => {
    expect(
      resolveRequestOrigin(
        "http://internal:3000/auth/callback",
        headersOf({
          host: "internal:3000",
          "x-forwarded-host": "food-cafe.example.com",
          "x-forwarded-proto": "https",
        })
      )
    ).toBe("https://food-cafe.example.com");
  });

  test("여러 값이 쉼표로 이어진 전달 헤더는 첫 값만 쓴다", () => {
    expect(
      resolveRequestOrigin(
        "http://internal/auth/callback",
        headersOf({
          "x-forwarded-host": "food-cafe.example.com, proxy.internal",
          "x-forwarded-proto": "https, http",
        })
      )
    ).toBe("https://food-cafe.example.com");
  });

  test("host 헤더가 없으면 req.url의 출처를 쓴다", () => {
    expect(resolveRequestOrigin("https://food-cafe.example.com/auth/callback", headersOf({}))).toBe(
      "https://food-cafe.example.com"
    );
  });

  test.each([
    [
      "http·https가 아닌 전달 프로토콜",
      { host: "evil.example", "x-forwarded-proto": "javascript" },
    ],
    ["경로가 섞인 host", { host: "evil.example/path" }],
    ["계정 정보가 섞인 host", { host: "user@evil.example" }],
    ["공백만 있는 전달 host", { "x-forwarded-host": "   ", host: "evil.example/x" }],
  ] as const)("%s는 쓰지 않고 req.url의 출처로 돌아간다", (_label, values) => {
    expect(
      resolveRequestOrigin("http://127.0.0.1:3100/auth/callback", headersOf({ ...values }))
    ).toBe("http://127.0.0.1:3100");
  });
});
