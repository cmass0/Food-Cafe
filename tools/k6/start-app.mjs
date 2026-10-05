// 부하 테스트용 빌드(build/loadtest)를 포트만 바꿔 띄운다(서버 여러 대 실험용).
//   사용법: node tools/k6/start-app.mjs <포트>
//   먼저 node tools/k6/build-app.mjs 로 빌드한다.
import { spawn } from "node:child_process";
import path from "node:path";

import { LOADTEST_DIST_DIR, ROOT, assertLocalBuild, readLoadTestEnv } from "./loadtest-env.mjs";

const [port] = process.argv.slice(2);
if (!port) {
  console.error("사용법: node tools/k6/start-app.mjs <포트>");
  process.exit(1);
}

assertLocalBuild();

const next = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
// 이미 정해진 환경변수는 .env 파일보다 우선하므로, 서버 쪽 값도 로컬 Supabase 값으로 고정된다.
// keepAliveTimeout: 분배기(nginx)는 쉬는 연결을 4초 뒤 닫는다. Node 기본값(5초)은 너무 가까워서,
// 바쁜 Node가 연결을 닫는 순간 분배기가 그 연결로 요청을 보내 "upstream prematurely closed"가 났다.
// 앱 서버 쪽을 넉넉히 길게 잡아 항상 분배기가 먼저 닫게 한다.
const child = spawn(
  process.execPath,
  [next, "start", "--hostname", "127.0.0.1", "--port", port, "--keepAliveTimeout", "30000"],
  {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, ...readLoadTestEnv(), NEXT_DIST_DIR: LOADTEST_DIST_DIR },
  }
);

child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
