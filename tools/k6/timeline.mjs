// 한 실행의 시간대별 표를 만든다: 사용자 수·초당 요청·실패율·응답 p95와, monitor로 남긴 앱 서버·DB CPU.
//   사용법: node tools/k6/timeline.mjs <testid> [Node CSV] [docker CSV] [간격 초=15]
import { existsSync, readFileSync } from "node:fs";

const [testId, nodeCsv, dockerCsv, stepArg] = process.argv.slice(2);
if (!testId) {
  console.error("사용법: node tools/k6/timeline.mjs <testid> [Node CSV] [docker CSV] [간격 초]");
  process.exit(1);
}
const step = Number(stepArg ?? 15);
const PROMETHEUS = "http://127.0.0.1:9090";
const T = `testid="${testId}"`;

async function range(query, start, end) {
  const url = new URL(`${PROMETHEUS}/api/v1/query_range`);
  url.search = new URLSearchParams({ query, start, end, step: String(step) }).toString();
  const json = await (await fetch(url)).json();
  const values = json.data.result[0]?.values ?? [];
  return new Map(values.map(([t, v]) => [Math.round(t), Number(v)]));
}

// 실행 시간 범위는 사용자 수 기록이 있는 구간으로 잡는다.
// testid에는 시작 시각이 들어 있다(run.mjs: 이름-YYYYMMDD-HHMMSS[-프로세스 번호]). 그 시각부터 6시간 안에서
// 마지막 기록을 찾으므로, 보존 기간(180일) 안의 지난 실행도 찾는다. 시각을 못 읽으면 최근 하루에서 찾는다.
const LOOKAHEAD_S = 6 * 3600;
const startedAt = (() => {
  const m = testId.match(/-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})(?:-\d+)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m.map(Number);
  return new Date(y, mo - 1, d, h, mi, s).getTime() / 1000;
})();
const evalAt = startedAt ? Math.min(startedAt + LOOKAHEAD_S, Date.now() / 1000) : Date.now() / 1000;
const lookback = startedAt ? `${LOOKAHEAD_S}s` : "1d";
const bounds = await (
  await fetch(
    `${PROMETHEUS}/api/v1/query?query=${encodeURIComponent(`max_over_time(timestamp(k6_vus{${T}})[${lookback}:5s])`)}&time=${evalAt}`
  )
).json();
const lastAt = Number(bounds.data.result[0]?.value[1]);
if (!Number.isFinite(lastAt)) {
  console.error(`${testId}의 기록을 찾지 못했습니다(Prometheus 보존 기간이 지났거나 testid가 다름).`);
  process.exit(1);
}
const firstJson = await (
  await fetch(
    `${PROMETHEUS}/api/v1/query?query=${encodeURIComponent(`min_over_time(timestamp(k6_vus{${T}})[2h:5s])`)}&time=${lastAt}`
  )
).json();
const firstAt = Number(firstJson.data.result[0]?.value[1]);
const start = Math.floor(firstAt);
const end = Math.ceil(lastAt);

const w = `${step * 2}s`;
const [vus, rps, failRps, p95] = await Promise.all([
  range(`max(k6_vus{${T}})`, start, end),
  range(`sum(rate(k6_http_reqs_total{${T}}[${w}]))`, start, end),
  range(`sum(rate(k6_http_reqs_total{${T},expected_response="false"}[${w}])) or vector(0)`, start, end),
  range(`histogram_quantile(0.95, sum(rate(k6_http_req_duration_seconds{${T}}[${w}])))`, start, end),
]);

// CSV의 "HH:mm:ss"를 실행 시작 날짜의 초로 바꿔 가장 가까운 기록을 붙인다.
// 시각이 앞 행보다 작아지면 자정을 넘긴 것이므로 다음 날로 넘긴다.
function loadCsv(path, pick) {
  if (!path || !existsSync(path)) return [];
  const day = new Date(start * 1000);
  let dayOffset = 0;
  let previousSeconds = -1;
  return readFileSync(path, "utf8")
    .replace(/^﻿/, "")
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(","))
    .map((cols) => {
      const [h, m, s] = cols[0].split(":").map(Number);
      const seconds = h * 3600 + m * 60 + s;
      if (previousSeconds >= 0 && seconds < previousSeconds) dayOffset += 1;
      previousSeconds = seconds;
      return { cols, h, m, s, offset: dayOffset };
    })
    .filter(({ cols }) => pick.filter(cols))
    .map(({ cols, h, m, s, offset }) => {
      const at = new Date(day);
      at.setDate(at.getDate() + offset);
      at.setHours(h, m, s, 0);
      return { at: at.getTime() / 1000, value: pick.value(cols) };
    });
}
const nodeCpu = loadCsv(nodeCsv, { filter: () => true, value: (c) => Number(c[1]) });
const dbCpu = loadCsv(dockerCsv, {
  filter: (c) => c[1] === "supabase_db",
  value: (c) => Number(c[2].replace("%", "")),
});
const near = (rows, t) => {
  const inWindow = rows.filter((r) => r.at > t - step && r.at <= t);
  return inWindow.length ? Math.max(...inWindow.map((r) => r.value)) : undefined;
};

const pad = (v, n) => String(v).padStart(n);
console.log("시각      사용자  초당요청  실패율   응답p95   앱CPU  DB CPU");
for (const t of [...vus.keys()].sort((a, b) => a - b)) {
  const total = rps.get(t) ?? 0;
  const failed = failRps.get(t) ?? 0;
  const time = new Date(t * 1000).toTimeString().slice(0, 8);
  const p = p95.get(t);
  const node = near(nodeCpu, t);
  const db = near(dbCpu, t);
  console.log(
    `${time} ${pad(vus.get(t), 6)} ${pad(total.toFixed(1), 9)} ${pad(total ? ((failed / total) * 100).toFixed(0) + "%" : "-", 7)} ${pad(p === undefined || Number.isNaN(p) ? "-" : p >= 1 ? p.toFixed(1) + "s" : (p * 1000).toFixed(0) + "ms", 9)} ${pad(node === undefined ? "-" : node.toFixed(0) + "%", 6)} ${pad(db === undefined ? "-" : db.toFixed(0) + "%", 7)}`
  );
}
