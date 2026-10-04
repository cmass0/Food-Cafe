type LimitedFetchOptions = {
  /** 동시에 보낼 수 있는 최대 요청 수 */
  maxConcurrent: number;
  /** 자리가 날 때까지 기다리는 최대 시간(ms). 넘으면 보내지 않고 거절한다 */
  maxWaitMs: number;
  /** 실제로 요청을 보낼 함수. 없으면 호출할 때의 전역 fetch를 쓴다 */
  fetchImpl?: typeof fetch;
};

type Waiter = {
  start: () => void;
  reject: (reason: unknown) => void;
};

// 본문을 가질 수 없는 응답 상태. 이 상태에 본문을 넣어 Response를 만들면 오류가 난다.
const NULL_BODY_STATUSES = new Set([101, 103, 204, 205, 304]);

/**
 * 동시 요청 수를 묶는 fetch.
 *
 * - maxConcurrent개까지는 바로 보내고, 넘치는 요청은 들어온 순서대로 자리를 기다린다.
 * - 응답 본문을 다 받을 때까지 자리를 차지한다. 본문을 받는 동안에도 연결을 쓰고 있기 때문이다.
 * - maxWaitMs 넘게 기다린 요청은 보내지 않고 AbortError로 거절한다.
 *   Supabase 클라이언트는 AbortError를 다시 시도하지 않으므로, 몰릴 때 재시도가 요청을 더 늘리지 않는다.
 */
export function createLimitedFetch({
  maxConcurrent,
  maxWaitMs,
  fetchImpl,
}: LimitedFetchOptions): typeof fetch {
  let active = 0;
  const queue: Waiter[] = [];

  function release() {
    const next = queue.shift();
    // 기다리는 요청이 있으면 자리를 그대로 넘기므로 active는 그대로다.
    if (next) next.start();
    else active -= 1;
  }

  function acquire(signal: AbortSignal | null | undefined): Promise<void> {
    if (active < maxConcurrent) {
      active += 1;
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      };
      const waiter: Waiter = {
        start: () => {
          cleanup();
          resolve();
        },
        reject: (reason) => {
          cleanup();
          reject(reason);
        },
      };
      const leave = (reason: unknown) => {
        const index = queue.indexOf(waiter);
        if (index !== -1) queue.splice(index, 1);
        waiter.reject(reason);
      };
      const onAbort = () => leave(signal?.reason);
      const timer = setTimeout(
        () =>
          leave(
            new DOMException(
              `Supabase 요청이 ${maxWaitMs}ms 넘게 차례를 기다려 보내지 않았습니다.`,
              "AbortError"
            )
          ),
        maxWaitMs
      );
      signal?.addEventListener("abort", onAbort, { once: true });
      queue.push(waiter);
    });
  }

  return async (input, init) => {
    if (init?.signal?.aborted) throw init.signal.reason;
    await acquire(init?.signal);
    try {
      const response = await (fetchImpl ?? fetch)(input, init);
      const body = NULL_BODY_STATUSES.has(response.status) ? null : await response.arrayBuffer();
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    } finally {
      release();
    }
  };
}
