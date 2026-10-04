import { describe, expect, test, vi } from "vitest";

import { processSingleton } from "./process-singleton";

let sequence = 0;
function uniqueName() {
  sequence += 1;
  return `test-${Date.now()}-${sequence}`;
}

describe("processSingleton", () => {
  test("같은 이름이면 처음 만든 것을 계속 돌려주고 다시 만들지 않는다", () => {
    const name = uniqueName();
    const create = vi.fn(() => ({ id: "first" }));

    const first = processSingleton(name, create);
    const second = processSingleton(name, () => ({ id: "second" }));

    expect(second).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  test("이름이 다르면 따로 만든다", () => {
    const a = processSingleton(uniqueName(), () => ({ id: "a" }));
    const b = processSingleton(uniqueName(), () => ({ id: "b" }));

    expect(a).not.toBe(b);
    expect([a.id, b.id]).toEqual(["a", "b"]);
  });
});
