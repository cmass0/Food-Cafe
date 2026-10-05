// 같은 빌드를 포트만 바꿔 띄운다(서버 여러 대 실험용).
//   사용법: node tools/k6/start-app.mjs <포트>
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [port] = process.argv.slice(2);
if (!port) {
  console.error("사용법: node tools/k6/start-app.mjs <포트>");
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const next = path.join(root, "node_modules", "next", "dist", "bin", "next");
// keepAliveTimeout: 분배기(nginx)는 쉬는 연결을 4초 뒤 닫는다. Node 기본값(5초)은 너무 가까워서,
// 바쁜 Node가 연결을 닫는 순간 분배기가 그 연결로 요청을 보내 "upstream prematurely closed"가 났다.
// 앱 서버 쪽을 넉넉히 길게 잡아 항상 분배기가 먼저 닫게 한다.
const child = spawn(
  process.execPath,
  [next, "start", "--hostname", "127.0.0.1", "--port", port, "--keepAliveTimeout", "30000"],
  { cwd: root, stdio: "inherit" }
);

child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
