// 같은 빌드를 포트와 Supabase 동시 연결 몫만 바꿔 띄운다(서버 여러 대 실험용).
// 서버마다 Supabase 연결을 따로 세므로, 여러 대를 띄울 때는 정문 몫(약 256)을 서버 수로 나눠 준다.
//   사용법: node tools/k6/start-app.mjs <포트> <Supabase 동시 연결 수>
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [port, connections] = process.argv.slice(2);
if (!port || !connections) {
  console.error("사용법: node tools/k6/start-app.mjs <포트> <Supabase 동시 연결 수>");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const next = path.join(root, "node_modules", "next", "dist", "bin", "next");
// 이미 정해진 환경변수는 .env 파일보다 우선하므로, 서버마다 다른 연결 수를 줄 수 있다.
// keepAliveTimeout: 분배기(nginx)는 쉬는 연결을 4초 뒤 닫는다. Node 기본값(5초)은 너무 가까워서,
// 바쁜 Node가 연결을 닫는 순간 분배기가 그 연결로 요청을 보내 "upstream prematurely closed"가 났다.
// 앱 서버 쪽을 넉넉히 길게 잡아 항상 분배기가 먼저 닫게 한다.
const child = spawn(
  process.execPath,
  [next, "start", "--hostname", "127.0.0.1", "--port", port, "--keepAliveTimeout", "30000"],
  {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, SUPABASE_FETCH_MAX_CONCURRENT: connections },
  }
);

child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
