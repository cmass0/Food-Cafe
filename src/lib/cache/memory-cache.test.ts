import { describe, expect, test, vi } from "vitest";

import { createMemoryCache } from "./memory-cache";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 뒤에서 진행 중인 갱신이 결과를 저장할 때까지 기다린다.
function settle() {
  return sleep(0);
}

// 만료를 기다리지 않는 테스트는 넉넉한 시간을, 만료를 확인하는 테스트는 짧은 시간을 쓴다.
const LONG_TTL = { ttlMs: 60_000, max: 10 };
const SHORT_TTL = { ttlMs: 20, max: 10 };
const PAST_SHORT_TTL_MS = 40;

describe("createMemoryCache", () => {
  test("같은 키를 동시에 요청하면 load를 한 번만 실행하고 모두 같은 값을 받는다", async () => {
    const cache = createMemoryCache<string[]>(LONG_TTL);
    const pending = deferred<string[]>();
    const load = vi.fn(() => pending.promise);

    const requests = Array.from({ length: 5 }, () => cache.get("recipe:4:week", load));
    pending.resolve(["a"]);

    await expect(Promise.all(requests)).resolves.toEqual([["a"], ["a"], ["a"], ["a"], ["a"]]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  test("만료 전에는 다시 load하지 않고 저장한 값을 돌려준다", async () => {
    const cache = createMemoryCache<string[]>(LONG_TTL);
    await cache.get("recipe:4:week", async () => ["first"]);
    const load = vi.fn(async () => ["second"]);

    await expect(cache.get("recipe:4:week", load)).resolves.toEqual(["first"]);
    expect(load).not.toHaveBeenCalled();
  });

  test("빈 목록도 저장해 만료 전에는 다시 load하지 않는다", async () => {
    const cache = createMemoryCache<string[]>(LONG_TTL);
    await cache.get("recipe:4:day", async () => []);
    const load = vi.fn(async () => ["late"]);

    await expect(cache.get("recipe:4:day", load)).resolves.toEqual([]);
    expect(load).not.toHaveBeenCalled();
  });

  test("키가 다르면 따로 load한다", async () => {
    const cache = createMemoryCache<string[]>(LONG_TTL);

    await expect(cache.get("recipe:4:week", async () => ["week"])).resolves.toEqual(["week"]);
    await expect(cache.get("recipe:4:day", async () => ["day"])).resolves.toEqual(["day"]);
  });

  test("만료된 뒤 첫 요청은 직전 값을 바로 받고, 새로 가져온 값은 다음 요청부터 받는다", async () => {
    const cache = createMemoryCache<string[]>(SHORT_TTL);
    await cache.get("recipe:4:week", async () => ["old"]);
    await sleep(PAST_SHORT_TTL_MS);
    const refresh = deferred<string[]>();

    await expect(cache.get("recipe:4:week", () => refresh.promise)).resolves.toEqual(["old"]);
    refresh.resolve(["new"]);
    await settle();

    await expect(cache.get("recipe:4:week", async () => ["unused"])).resolves.toEqual(["new"]);
  });

  test("load가 실패하면 오류를 그대로 던지고, 다음 요청이 다시 load한다", async () => {
    const cache = createMemoryCache<string[]>(LONG_TTL);
    const failure = new Error("DB 연결 실패");

    await expect(
      cache.get("recipe:4:week", async () => {
        throw failure;
      })
    ).rejects.toBe(failure);
    await expect(cache.get("recipe:4:week", async () => ["retry"])).resolves.toEqual(["retry"]);
  });

  test("만료 뒤 새로 가져오기가 실패해도 그 요청은 직전 값을 받고, 다음 요청이 다시 load한다", async () => {
    const cache = createMemoryCache<string[]>(SHORT_TTL);
    await cache.get("recipe:4:week", async () => ["old"]);
    await sleep(PAST_SHORT_TTL_MS);
    const refresh = deferred<string[]>();

    await expect(cache.get("recipe:4:week", () => refresh.promise)).resolves.toEqual(["old"]);
    refresh.reject(new Error("DB 연결 실패"));
    await settle();

    await expect(cache.get("recipe:4:week", async () => ["retry"])).resolves.toEqual(["retry"]);
  });

  test("clear 뒤 요청은 새로 load한다", async () => {
    const cache = createMemoryCache<string[]>(LONG_TTL);
    await cache.get("recipe:4:week", async () => ["before"]);

    cache.clear();

    await expect(cache.get("recipe:4:week", async () => ["after"])).resolves.toEqual(["after"]);
  });

  test("clear 전에 시작한 load를 기다리던 요청도 결과를 받는다", async () => {
    const cache = createMemoryCache<string[]>(LONG_TTL);
    const pending = deferred<string[]>();
    const waiting = cache.get("recipe:4:week", () => pending.promise);

    cache.clear();
    pending.resolve(["in-flight"]);

    await expect(waiting).resolves.toEqual(["in-flight"]);
  });
});
