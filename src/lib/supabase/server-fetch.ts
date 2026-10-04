import { Agent } from "undici";

import { processSingleton } from "@/lib/process-singleton";
import { createLimitedFetch } from "./limited-fetch";

// 서버의 모든 Supabase 클라이언트가 같이 쓰는 요청 창구.
// 로컬 Supabase 게이트웨이는 연결을 512개까지만 받고, 넘치면 쓰던 연결을 강제로 끊는다.
// 부하 테스트에서 이 때문에 503이 나고, 읽기 요청은 1·2·4초 쉬며 다시 시도하느라 응답이 20초대로 튀었다.
// 512에는 게이트웨이가 뒤쪽 서버로 여는 연결도 들어가서(요청 하나에 연결 2개) 앱이 쓸 수 있는 몫은 약 256개다.
// 그래서 동시 요청을 200개로 묶어 넘치는 요청은 서버 안에서 차례를 기다리게 하고,
// 너무 오래 기다린 요청은 보내지 않고 바로 실패시킨다(사용자가 이미 떠났을 요청에 일을 쓰지 않도록).
// 게이트웨이 뒤의 REST 서버는 DB에 동시에 10개만 보내므로 200으로 묶어도 처리량은 줄지 않는다.
// 서버를 여러 대 띄우면 서버마다 따로 세므로, 몫을 서버 수로 나눠 SUPABASE_FETCH_MAX_CONCURRENT로 준다.
const DEFAULT_MAX_CONCURRENT = 200;
const DEFAULT_MAX_WAIT_MS = 10_000;

function readPositiveInt(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

export function getSupabaseServerFetch(): typeof fetch {
  return processSingleton("supabase-server-fetch", () => {
    const maxConcurrent = readPositiveInt("SUPABASE_FETCH_MAX_CONCURRENT", DEFAULT_MAX_CONCURRENT);
    // 동시 요청 수만 묶으면, 끝난 요청의 연결을 재사용하려고 남겨 둔 사이 다음 요청이 새 연결을 열어
    // 실제 연결이 상한의 1.5~1.9배까지 늘었다(부하 테스트에서 200 → 293개). 연결 수 자체에도 같은 상한을 건다.
    // Node 기본 fetch는 dispatcher 옵션으로 받은 연결 관리자를 쓴다(Next가 감싼 fetch도 옵션을 그대로 넘긴다).
    const agent = new Agent({ connections: maxConcurrent });
    const fetchWithAgent: typeof fetch = (input, init) =>
      fetch(input, { ...init, dispatcher: agent } as RequestInit);

    return createLimitedFetch({
      maxConcurrent,
      maxWaitMs: readPositiveInt("SUPABASE_FETCH_MAX_WAIT_MS", DEFAULT_MAX_WAIT_MS),
      fetchImpl: fetchWithAgent,
    });
  });
}
