// 장애 테스트: k6가 도는 동안 사용자 수 계단(100·300·600·1,000명)마다 로컬 DB에 장애를 30초씩 넣고 푼다.
//   사용법: node tools/k6/inject-fault.mjs <종류>   (먼저 켜 두고 run.mjs로 tools/k6/scripts/faults.js를 실행)
//   종류  pause: DB 컨테이너를 얼린다. 연결은 살아 있는데 답이 오지 않는다(응답 없이 멈춤)
//         stop:  DB 컨테이너를 멈췄다가 다시 켠다. 연결이 바로 끊긴다(꺼짐)
// 계단에 도착하고 30초 뒤 장애 30초 → 풀고 남은 시간 동안 회복을 지켜본다(faults.js는 계단마다 2분 머문다).
// 장애 중인지를 127.0.0.1:9102/metrics(fault_active)로 열어 Grafana 그래프에 장애 구간을 표시하고,
// 정확한 시각은 tools/k6/reports/에 남긴다. 끝나거나 Ctrl+C로 멈춰도 장애는 반드시 푼다. 로컬 Docker만 건드린다.
import { execFileSync } from "node:child_process";
import { appendFileSync, mkdirSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";

import { ROOT, readLoadTestEnv } from "./loadtest-env.mjs";

const PROMETHEUS_URL = "http://127.0.0.1:9090";
const METRICS_PORT = 9102;
const STEPS = [100, 300, 600, 1000];
const WAIT_BEFORE_MS = 30_000;
const FAULT_MS = 30_000;

const { SUPABASE_PROJECT_ID } = readLoadTestEnv();
if (!SUPABASE_PROJECT_ID) throw new Error(".env.loadtest.local에 SUPABASE_PROJECT_ID가 없습니다.");
const DB_CONTAINER = `supabase_db_${SUPABASE_PROJECT_ID}`;

const FAULTS = {
  pause: {
    inject: () => docker("pause", DB_CONTAINER),
    restore: () => docker("unpause", DB_CONTAINER),
  },
  stop: {
    inject: () => docker("stop", DB_CONTAINER),
    restore: () => docker("start", DB_CONTAINER),
  },
};

const type = process.argv[2];
const fault = FAULTS[type];
if (!fault) {
  console.error(`사용법: node tools/k6/inject-fault.mjs <${Object.keys(FAULTS).join("|")}>`);
  process.exit(1);
}

function docker(...args) {
  execFileSync("docker", args, { stdio: "ignore", timeout: 60_000 });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const reportDir = path.join(ROOT, "tools/k6/reports");
mkdirSync(reportDir, { recursive: true });
const logPath = path.join(reportDir, `faults-${type}-${Date.now()}.log`);
function log(event, detail = {}) {
  const line = JSON.stringify({
    at: new Date().toISOString(),
    ms: Date.now(),
    event,
    type,
    ...detail,
  });
  appendFileSync(logPath, `${line}\n`);
  console.log(line);
}

let active = false;
let injections = 0;
const server = createServer((request, response) => {
  if (request.url !== "/metrics") {
    response.writeHead(404).end();
    return;
  }
  response.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  response.end(
    [
      "# HELP fault_active 지금 장애를 넣은 상태인가(1)",
      "# TYPE fault_active gauge",
      `fault_active{type="${type}"} ${active ? 1 : 0}`,
      "# HELP fault_injections_total 넣은 장애 수",
      "# TYPE fault_injections_total counter",
      `fault_injections_total{type="${type}"} ${injections}`,
      "",
    ].join("\n")
  );
});
server.listen(METRICS_PORT, "127.0.0.1");

// 어떤 경우에도 장애를 풀고 끝낸다.
function restoreIfActive(reason) {
  if (!active) return;
  try {
    fault.restore();
    log("restore", { reason });
  } catch (error) {
    console.error(
      `장애를 풀지 못했습니다. 직접 확인하세요: docker ps -a | grep ${DB_CONTAINER}`,
      error
    );
  }
  active = false;
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    restoreIfActive(signal);
    process.exit(130);
  });
}

// 지금 돌고 있는 k6의 사용자 수. 최근 10초 안에 기록이 없으면(돌고 있지 않으면) null.
async function currentUsers() {
  try {
    const query = encodeURIComponent("sum(last_over_time(k6_vus[10s]))");
    const body = await (await fetch(`${PROMETHEUS_URL}/api/v1/query?query=${query}`)).json();
    const sample = body.data?.result?.[0];
    return sample ? Number(sample.value[1]) : null;
  } catch {
    return null;
  }
}

async function waitForUsers(target) {
  for (;;) {
    const users = await currentUsers();
    if (users === target) return;
    await sleep(2_000);
  }
}

try {
  log("ready", { container: DB_CONTAINER, steps: STEPS });
  for (const target of STEPS) {
    await waitForUsers(target);
    log("step-reached", { users: target });
    await sleep(WAIT_BEFORE_MS);
    injections += 1;
    active = true;
    fault.inject();
    log("inject", { users: target });
    await sleep(FAULT_MS);
    restoreIfActive("planned");
  }
  log("done");
} finally {
  restoreIfActive("finally");
  server.close();
}
