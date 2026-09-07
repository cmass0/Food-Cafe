import { expect, test } from "vitest";

import { normalizeReturnTo } from "./return-to";

test("로그인 복귀 주소가 외부 사이트이면 홈 경로로 바꾼다", () => {
  // 준비: 슬래시 두 개로 시작하는 외부 사이트 주소를 전달한다.
  const next = "//example.com/phishing";

  // 실행: 서비스에서 실제 사용하는 복귀 경로 검증 함수를 호출한다.
  const result = normalizeReturnTo(next);

  // 확인: 외부 주소 대신 안전한 홈 경로가 반환되어야 한다.
  expect(result).toBe("/");
});
