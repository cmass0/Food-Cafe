// 가짜 window(dom-shim)가 있으면 서버용 Supabase 클라이언트가 버려진 뒤에도 메모리에 남는지 확인한다.
// Next 서버를 빼고 원인 후보만 떼어 본다. 강제 GC가 필요하므로 --expose-gc로 실행한다.
//   사용법: node --expose-gc tools/k6/shim-leak-check.mjs [shim] [개수=5000]
import { createServerClient } from "@supabase/ssr";
import { JSDOM } from "jsdom";

const withShim = process.argv[2] === "shim";
const count = Number(process.argv[3] ?? 5000);

if (withShim) {
  // src/lib/dom-shim.ts와 같은 방식으로 전역에 window·document를 심는다.
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
}

const heapMb = () => {
  globalThis.gc();
  globalThis.gc();
  return (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
};

const before = heapMb();
for (let i = 0; i < count; i++) {
  // 요청마다 만드는 서버 클라이언트와 같은 설정. 만든 뒤 바로 버린다.
  const client = createServerClient("http://127.0.0.1:54321", "anon-key-for-test", {
    cookies: { getAll: () => [], setAll: () => {} },
  });
  void client;
}
await new Promise((resolve) => setTimeout(resolve, 200));
const after = heapMb();

console.log(
  `${withShim ? "가짜 window 있음" : "가짜 window 없음"}: 클라이언트 ${count}개 생성·폐기 → 정리 후 힙 ${before}MB → ${after}MB`
);
process.exit(0);
