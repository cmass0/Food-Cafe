import { describe, expect, test } from "vitest";

import { resolveClientIpKey } from "./client-ip";

function headersOf(values: Record<string, string>) {
  return new Headers(values);
}

describe("resolveClientIpKey", () => {
  test("x-real-ip가 있으면 x-forwarded-for보다 먼저 쓴다", () => {
    expect(
      resolveClientIpKey(
        headersOf({ "x-real-ip": "203.0.113.7", "x-forwarded-for": "198.51.100.1" })
      )
    ).toBe("203.0.113.7");
  });

  test("x-forwarded-for는 첫 번째 주소만 쓴다", () => {
    expect(resolveClientIpKey(headersOf({ "x-forwarded-for": " 198.51.100.1 , 10.0.0.1" }))).toBe(
      "198.51.100.1"
    );
  });

  test.each([
    ["헤더 없음", {}],
    ["빈 값", { "x-real-ip": "" }],
    ["공백만", { "x-forwarded-for": "   " }],
  ] as const)("%s이면 null을 돌려준다", (_label, values) => {
    expect(resolveClientIpKey(headersOf(values))).toBeNull();
  });

  test.each([
    ["2001:db8:abcd:12:1:2:3:4", "2001:0db8:abcd:0012::/64"],
    ["2001:DB8:ABCD:12::99", "2001:0db8:abcd:0012::/64"],
    ["2001:db8::1", "2001:0db8:0000:0000::/64"],
    ["::1", "0000:0000:0000:0000::/64"],
    ["fe80::1%eth0", "fe80:0000:0000:0000::/64"],
  ] as const)("IPv6 %s는 앞 64비트 %s로 묶는다", (ip, expected) => {
    expect(resolveClientIpKey(headersOf({ "x-real-ip": ip }))).toBe(expected);
  });

  test("같은 /64 대역의 다른 주소는 같은 키가 된다", () => {
    const first = resolveClientIpKey(headersOf({ "x-real-ip": "2001:db8:1:2::a" }));
    const second = resolveClientIpKey(headersOf({ "x-real-ip": "2001:db8:1:2:ffff:1:2:3" }));
    expect(first).toBe(second);
  });

  test("IPv4가 담긴 IPv6 주소는 IPv4로 센다", () => {
    expect(resolveClientIpKey(headersOf({ "x-real-ip": "::ffff:203.0.113.7" }))).toBe(
      "203.0.113.7"
    );
  });

  test.each([
    ["256이 넘는 IPv4", "203.0.113.256"],
    ["세 칸짜리 IPv4", "203.0.113"],
    ["범위를 넘는 IPv4가 담긴 IPv6", "::ffff:999.0.0.1"],
    ["::가 두 번", "2001::db8::1"],
    ["아홉 칸 IPv6", "1:2:3:4:5:6:7:8:9"],
    ["::와 여덟 칸", "::1:2:3:4:5:6:7:8"],
    ["16진수가 아닌 칸", "2001:db8::xyz"],
    ["다섯 자리 칸", "2001:db8::12345"],
    ["포트가 붙은 주소", "203.0.113.7:8080"],
    ["주소가 아닌 값", "unknown"],
  ] as const)("%s(%s)는 null을 돌려준다", (_label, ip) => {
    expect(resolveClientIpKey(headersOf({ "x-real-ip": ip }))).toBeNull();
  });
});
