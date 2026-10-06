import { LRUCache } from "lru-cache";

type MemoryCacheOptions = {
  /** 값을 가져온 뒤 다시 가져올 때까지의 시간(ms) */
  ttlMs: number;
  /** 들고 있을 최대 항목 수. 넘으면 가장 오래 안 쓴 항목부터 버린다 */
  max: number;
};

type Loader<V> = () => Promise<V>;

/**
 * 서버 메모리에 값을 잠깐 들고 여러 요청이 같이 쓰게 하는 캐시.
 *
 * - 같은 키를 동시에 여러 요청이 원하면 load는 한 번만 실행되고 모두 그 결과를 받는다.
 * - ttlMs가 지난 뒤 첫 요청은 직전 값을 바로 받고, 그동안 새 값을 가져와 다음 요청부터 쓴다.
 * - load가 실패하면 저장하지 않는다. 직전 값이 없으면 오류를 그대로 던지고, 다음 요청이 다시 시도한다.
 *
 * 서버 프로세스마다 따로 들고 있으므로, 서버를 여러 대 띄우면 서버마다 따로 load한다.
 */
export function createMemoryCache<V extends NonNullable<unknown>>({
  ttlMs,
  max,
}: MemoryCacheOptions) {
  const store = new LRUCache<string, V, Loader<V>>({
    max,
    ttl: ttlMs,
    allowStale: true,
    fetchMethod: (_key, _staleValue, { context }) => context(),
  });
  // clear()는 항목을 지우지 않고 이 번호만 올린다. 지우면 진행 중인 load가 중단돼 그 결과를 기다리던
  // 요청까지 실패하기 때문이다. 옛 번호의 항목은 아무도 찾지 않다가 max를 넘으면 밀려난다.
  let generation = 0;

  return {
    async get<T extends V>(key: string, load: Loader<T>): Promise<T> {
      // fetchMethod가 load 결과를 그대로 돌려주므로 undefined가 나오는 경우는 없다.
      return (await store.fetch(`${generation}:${key}`, { context: load })) as T;
    },
    /** 들고 있는 값을 모두 버린다. 이후 요청은 새로 load한다. */
    clear() {
      generation += 1;
    },
  };
}
