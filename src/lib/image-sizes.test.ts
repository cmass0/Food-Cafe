import { describe, expect, test } from "vitest";

import { capImageDensity } from "./image-sizes";

const X4 = "(min-resolution: 3.5dppx)";
const X3 = "(min-resolution: 2.5dppx)";

describe("capImageDensity", () => {
  test("조건이 있는 항목마다 같은 조건의 고배율 항목을 높은 배율부터 바로 앞에 붙인다", () => {
    expect(capImageDensity("(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw")).toBe(
      [
        `(max-width: 640px) and ${X4} calc(100vw * 1 / 2)`,
        `(max-width: 640px) and ${X3} calc(100vw * 2 / 3)`,
        "(max-width: 640px) 100vw",
        `(max-width: 1024px) and ${X4} calc(50vw * 1 / 2)`,
        `(max-width: 1024px) and ${X3} calc(50vw * 2 / 3)`,
        "(max-width: 1024px) 50vw",
        `${X4} calc(25vw * 1 / 2)`,
        `${X3} calc(25vw * 2 / 3)`,
        "25vw",
      ].join(", ")
    );
  });

  test("조건 없는 고정 폭 하나도 고배율 항목을 붙인다", () => {
    expect(capImageDensity("190px")).toBe(
      `${X4} calc(190px * 1 / 2), ${X3} calc(190px * 2 / 3), 190px`
    );
  });

  test("여러 조건을 and로 이은 항목은 조건 전체를 유지한다", () => {
    expect(capImageDensity("(min-width: 641px) and (max-width: 1024px) 50vw")).toBe(
      [
        `(min-width: 641px) and (max-width: 1024px) and ${X4} calc(50vw * 1 / 2)`,
        `(min-width: 641px) and (max-width: 1024px) and ${X3} calc(50vw * 2 / 3)`,
        "(min-width: 641px) and (max-width: 1024px) 50vw",
      ].join(", ")
    );
  });

  test("빈 문자열과 빈 항목은 결과에 남기지 않는다", () => {
    expect(capImageDensity("")).toBe("");
    expect(capImageDensity(" 25vw , ")).toBe(
      `${X4} calc(25vw * 1 / 2), ${X3} calc(25vw * 2 / 3), 25vw`
    );
  });

  test.each([
    ["공백이 든 calc 폭", "calc(100vw - 40px)"],
    ["조건 뒤 공백이 든 calc 폭", "(max-width: 640px) calc(100vw - 40px)"],
  ] as const)("해석할 수 없는 %s 항목은 바꾸지 않는다", (_label, sizes) => {
    expect(capImageDensity(sizes)).toBe(sizes);
  });
});
