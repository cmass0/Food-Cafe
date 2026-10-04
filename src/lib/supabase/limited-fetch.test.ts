import { afterEach, describe, expect, test, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

import { respondWithSupabaseError } from "@/lib/errors/api-response";
import { createLimitedFetch } from "./limited-fetch";

const URL_A = "https://project.supabase.co/rest/v1/a";
const URL_B = "https://project.supabase.co/rest/v1/b";
const URL_C = "https://project.supabase.co/rest/v1/c";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// 요청마다 응답을 직접 정할 수 있는 가짜 네트워크. 보낸 주소를 순서대로 기록한다.
function fakeNetwork() {
  const pending = new Map<string, ReturnType<typeof deferred<Response>>>();
  const send = vi.fn((input: string | URL | Request) => {
    const answer = deferred<Response>();
    pending.set(String(input), answer);
    return answer.promise;
  });
  const sentUrls = () => send.mock.calls.map(([input]) => String(input));
  const respond = (url: string, response = new Response("ok")) =>
    pending.get(url)?.resolve(response);
  const fail = (url: string, reason: unknown) => pending.get(url)?.reject(reason);
  return { send, sentUrls, respond, fail };
}

// 기다리는 요청이 자리를 넘겨받아 실제로 보내질 때까지 한 번 양보한다.
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createLimitedFetch", () => {
  test("한도까지는 기다리지 않고 바로 보낸다", async () => {
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 2,
      maxWaitMs: 1000,
      fetchImpl: network.send,
    });

    void limited(URL_A);
    void limited(URL_B);
    await settle();

    expect(network.sentUrls()).toEqual([URL_A, URL_B]);
  });

  test("한도를 넘은 요청은 기다렸다가 들어온 순서대로 보낸다", async () => {
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 1,
      maxWaitMs: 1000,
      fetchImpl: network.send,
    });

    const first = limited(URL_A);
    const second = limited(URL_B);
    const third = limited(URL_C);
    await settle();
    expect(network.sentUrls()).toEqual([URL_A]);

    network.respond(URL_A);
    await first;
    await settle();
    expect(network.sentUrls()).toEqual([URL_A, URL_B]);

    network.respond(URL_B);
    await second;
    await settle();
    network.respond(URL_C);
    await third;
    expect(network.sentUrls()).toEqual([URL_A, URL_B, URL_C]);
  });

  test("응답 본문을 다 받을 때까지 자리를 차지한다", async () => {
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 1,
      maxWaitMs: 1000,
      fetchImpl: network.send,
    });
    let closeBody!: () => void;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("part"));
        closeBody = () => controller.close();
      },
    });

    const first = limited(URL_A);
    const second = limited(URL_B);
    await settle();
    network.respond(URL_A, new Response(body));
    await settle();
    expect(network.sentUrls()).toEqual([URL_A]);

    closeBody();
    await expect((await first).text()).resolves.toBe("part");
    await settle();
    expect(network.sentUrls()).toEqual([URL_A, URL_B]);
    network.respond(URL_B);
    await second;
  });

  test("대기 한도를 넘긴 요청은 보내지 않고 AbortError로 거절한다", async () => {
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 1,
      maxWaitMs: 20,
      fetchImpl: network.send,
    });

    const first = limited(URL_A);
    await expect(limited(URL_B)).rejects.toMatchObject({ name: "AbortError" });
    expect(network.sentUrls()).toEqual([URL_A]);

    network.respond(URL_A);
    await first;
  });

  test("거절된 요청은 자리를 차지하지 않아 다음 요청이 바로 나간다", async () => {
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 1,
      maxWaitMs: 20,
      fetchImpl: network.send,
    });

    const first = limited(URL_A);
    await limited(URL_B).catch(() => {});
    network.respond(URL_A);
    await first;

    void limited(URL_C);
    await settle();
    expect(network.sentUrls()).toEqual([URL_A, URL_C]);
  });

  test("요청이 실패해도 자리를 돌려준다", async () => {
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 1,
      maxWaitMs: 1000,
      fetchImpl: network.send,
    });
    const failure = new TypeError("fetch failed");

    const first = limited(URL_A);
    const second = limited(URL_B);
    await settle();
    network.fail(URL_A, failure);

    await expect(first).rejects.toBe(failure);
    await settle();
    expect(network.sentUrls()).toEqual([URL_A, URL_B]);
    network.respond(URL_B);
    await second;
  });

  test("기다리는 중에 호출한 쪽이 취소하면 줄에서 빠지고 그 사유로 거절된다", async () => {
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 1,
      maxWaitMs: 1000,
      fetchImpl: network.send,
    });
    const controller = new AbortController();
    const reason = new Error("사용자가 페이지를 떠남");

    const first = limited(URL_A);
    const cancelled = limited(URL_B, { signal: controller.signal });
    controller.abort(reason);

    await expect(cancelled).rejects.toBe(reason);
    network.respond(URL_A);
    await first;
    await settle();
    expect(network.sentUrls()).toEqual([URL_A]);
  });

  test("받은 응답의 상태·헤더·본문을 그대로 돌려준다", async () => {
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 1,
      maxWaitMs: 1000,
      fetchImpl: network.send,
    });

    const pending = limited(URL_A);
    await settle();
    network.respond(
      URL_A,
      new Response('{"id":1}', { status: 201, statusText: "Created", headers: { "x-test": "yes" } })
    );
    const response = await pending;

    expect([response.status, response.statusText, response.headers.get("x-test")]).toEqual([
      201,
      "Created",
      "yes",
    ]);
    await expect(response.text()).resolves.toBe('{"id":1}');
  });

  test("본문이 없는 204 응답도 그대로 돌려준다", async () => {
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 1,
      maxWaitMs: 1000,
      fetchImpl: network.send,
    });

    const pending = limited(URL_A);
    await settle();
    network.respond(URL_A, new Response(null, { status: 204 }));
    const response = await pending;

    expect(response.status).toBe(204);
    await expect(response.text()).resolves.toBe("");
  });

  test("Supabase 클라이언트는 대기 한도로 거절된 읽기를 다시 시도하지 않고, 503으로 이어진다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const network = fakeNetwork();
    const limited = createLimitedFetch({
      maxConcurrent: 1,
      maxWaitMs: 20,
      fetchImpl: network.send,
    });
    const enter = vi.fn(limited);
    const client = createClient("https://project.supabase.co", "test-anon-key", {
      global: { fetch: enter },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const blocker = limited(URL_A);
    const { error } = await client.from("recipes").select("id");
    network.respond(URL_A);
    await blocker;

    expect(enter).toHaveBeenCalledTimes(1);
    expect(error?.code).toBe("");
    expect(error && respondWithSupabaseError(error).status).toBe(503);
  });
});
