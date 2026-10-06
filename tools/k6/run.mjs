// k6 시나리오를 실행하고 결과를 로컬 Prometheus(→ Grafana)로 보낸다. 끝나면 HTML 보고서를 tools/k6/reports/에 남긴다.
//   사용법: node tools/k6/run.mjs <시나리오 파일> [추가 k6 옵션...]
//   먼저 로컬 Supabase와 docker compose -f tools/k6/docker-compose.yml up -d 가 켜져 있어야 한다.
//   서버·DB 지표까지 보려면 수집기도 켠다(docker-compose.yml 맨 위 설명).
//   APP_PORTS=3301,3302 처럼 앱 서버 포트를 주면 그 프로세스의 CPU·메모리도 바깥에서 잰다.
import { execSync, spawn } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

import { startHostMetrics } from "./host-metrics.mjs";
import { readLoadTestEnv } from "./loadtest-env.mjs";

const PROMETHEUS_URL = "http://127.0.0.1:9090";
const GRAFANA_URL = "http://127.0.0.1:3200";
const REPORT_DIR = "tools/k6/reports";

const [script, ...extraArgs] = process.argv.slice(2);
if (!script) {
  console.error("사용법: node tools/k6/run.mjs <시나리오 파일> [추가 k6 옵션...]");
  process.exit(1);
}

function timestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  );
}

// 로컬 Supabase 주소와 공개 키를 supabase status에서 읽는다. 값은 화면에 출력하지 않는다.
// 로컬 Supabase를 SUPABASE_PROJECT_ID로 띄웠다면 같은 값을 줘야 그 컨테이너를 찾는다.
function localSupabaseEnv() {
  const { SUPABASE_PROJECT_ID } = readLoadTestEnv();
  const output = execSync("npx supabase status -o env", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
    env: { ...process.env, ...(SUPABASE_PROJECT_ID ? { SUPABASE_PROJECT_ID } : {}) },
  });
  const values = Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value])
  );
  if (!values.API_URL || !values.ANON_KEY) {
    throw new Error("로컬 Supabase가 꺼져 있습니다. npx supabase start 후 다시 실행하세요.");
  }
  return { SUPABASE_URL: values.API_URL, SUPABASE_ANON_KEY: values.ANON_KEY };
}

async function assertPrometheusReady() {
  try {
    const response = await fetch(`${PROMETHEUS_URL}/-/ready`);
    if (response.ok) return;
  } catch {
    // 아래에서 안내한다.
  }
  throw new Error(
    "Prometheus가 꺼져 있습니다. docker compose -f tools/k6/docker-compose.yml up -d 후 다시 실행하세요."
  );
}

function k6Binary() {
  const installed = "C:\\Program Files\\k6\\k6.exe";
  return process.platform === "win32" && existsSync(installed) ? installed : "k6";
}

await assertPrometheusReady();

// 같은 초에 두 실행을 시작해도 기록·보고서가 섞이지 않게 프로세스 번호를 붙인다.
const testId = `${path.basename(script, ".js")}-${timestamp()}-${process.pid}`;
mkdirSync(REPORT_DIR, { recursive: true });
const reportPath = path.join(REPORT_DIR, `${testId}.html`);

// Grafana는 Test ID와 기간이 함께 맞아야 보인다. 시작·끝 시각을 기록해 이 실행만 보는 주소를 만든다.
const startedAt = Date.now();
const grafanaLink = (from, to) =>
  `${GRAFANA_URL}/d/k6-prometheus/k6-prometheus?var-testid=${encodeURIComponent(testId)}&from=${from}&to=${to}`;

console.log(`testid: ${testId}`);
console.log(`실시간 화면: http://127.0.0.1:5665 (실행 중에만)`);
console.log(`Grafana(실행 중): ${grafanaLink("now-15m", "now")}`);

// 이 PC 전체 CPU·메모리와 k6 자신의 CPU를 실행하는 동안 Prometheus가 가져가게 연다.
const hostMetrics = startHostMetrics();

const k6 = spawn(
  k6Binary(),
  [
    "run",
    "--out",
    `web-dashboard=export=${reportPath}`,
    "--out",
    "experimental-prometheus-rw",
    "--tag",
    `testid=${testId}`,
    ...extraArgs,
    script,
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ...localSupabaseEnv(),
      // 실험용 앱(tools/k6/start-app.mjs로 띄운 서버) 주소.
      APP_URL: process.env.APP_URL ?? "http://127.0.0.1:3300",
      K6_PROMETHEUS_RW_SERVER_URL: `${PROMETHEUS_URL}/api/v1/write`,
      // 응답 시간을 히스토그램으로 보내 Grafana가 전체 요청 기준 백분위(p95 등)를 계산하게 한다.
      K6_FEATURES: "native-histograms",
    },
  }
);

hostMetrics.watch("k6", k6.pid);
for (const port of (process.env.APP_PORTS ?? "").split(",").filter(Boolean)) {
  hostMetrics.watchPort(port.trim());
}

k6.on("exit", (code) => {
  hostMetrics.close();
  if (existsSync(reportPath)) console.log(`HTML 보고서: ${reportPath}`);
  // 앞뒤로 30초 여유를 둔다.
  console.log(`Grafana(이 실행): ${grafanaLink(startedAt - 30_000, Date.now() + 30_000)}`);
  console.log(
    `서버·DB 지표(이 실행): ${GRAFANA_URL}/d/server-db/server-db?from=${startedAt - 30_000}&to=${Date.now() + 30_000}`
  );
  process.exit(code ?? 1);
});
