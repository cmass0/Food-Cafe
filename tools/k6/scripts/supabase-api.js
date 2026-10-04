// 로컬 Supabase API(PostgREST)에 레시피 목록·상세, 조합 목록 조회를 보낸다. 앱 서버를 거치지 않고 DB 쪽만 본다.
//   실행: node tools/k6/run.mjs tools/k6/scripts/supabase-api.js
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = `${__ENV.SUPABASE_URL}/rest/v1`;
const HEADERS = {
  apikey: __ENV.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${__ENV.SUPABASE_ANON_KEY}`,
};
// 전체 개수를 함께 요청하면 일부만 돌려줄 때 206이 오므로 2xx를 모두 성공으로 본다.
const isOk = (response) => response.status >= 200 && response.status < 300;

export const options = {
  stages: [
    { duration: "20s", target: 10 }, // 20초 동안 0명 → 10명
    { duration: "1m", target: 10 }, // 10명 유지
    { duration: "10s", target: 0 }, // 정리
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],
    http_req_failed: ["rate<0.01"],
    checks: ["rate>0.99"],
  },
};

// 시작 전에 상세 조회에 쓸 레시피 id를 받아 둔다.
export function setup() {
  const response = http.get(`${BASE}/recipes?select=id&limit=100`, { headers: HEADERS });
  return { ids: response.json().map((row) => row.id) };
}

export default function supabaseApi({ ids }) {
  const list = http.get(`${BASE}/recipes?select=*&order=created_at.desc&offset=0&limit=12`, {
    headers: { ...HEADERS, Prefer: "count=exact" },
    tags: { name: "레시피 목록" },
  });
  check(list, { "레시피 목록 응답": isOk });
  sleep(1);

  const id = ids[Math.floor(Math.random() * ids.length)];
  const detail = http.get(`${BASE}/recipes?select=*&id=eq.${id}`, {
    headers: HEADERS,
    tags: { name: "레시피 상세" },
  });
  check(detail, { "레시피 상세 응답": isOk });
  sleep(1);

  const combos = http.get(`${BASE}/combos?select=*&order=created_at.desc&limit=12`, {
    headers: { ...HEADERS, Prefer: "count=exact" },
    tags: { name: "조합 목록" },
  });
  check(combos, { "조합 목록 응답": isOk });
  sleep(1);
}
