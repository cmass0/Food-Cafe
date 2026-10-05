// 부하 테스트용 앱을 로컬 Supabase 주소로 빌드한다(결과는 build/loadtest, 평소 빌드 .next와 따로).
//   사용법: node tools/k6/build-app.mjs
// 이미 정해진 환경변수는 .env 파일보다 우선하므로, .env.loadtest.local 값을 환경변수로 넘겨 빌드한다.
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { LOADTEST_DIST_DIR, ROOT, assertLocalBuild, readLoadTestEnv } from "./loadtest-env.mjs";

// next build는 빌드 폴더의 타입 파일 경로를 tsconfig.json·next-env.d.ts에 적어 넣는다.
// 부하 테스트용 빌드 때문에 평소 설정이 바뀌지 않도록, 빌드가 끝나면(실패해도) 원래 내용으로 되돌린다.
const touchedFiles = ["tsconfig.json", "next-env.d.ts"]
  .map((name) => path.join(ROOT, name))
  .filter((file) => existsSync(file))
  .map((file) => ({ file, content: readFileSync(file) }));

const next = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [next, "build"], {
  cwd: ROOT,
  stdio: "inherit",
  env: { ...process.env, ...readLoadTestEnv(), NEXT_DIST_DIR: LOADTEST_DIST_DIR },
});

child.on("exit", (code) => {
  for (const { file, content } of touchedFiles) writeFileSync(file, content);
  if (code !== 0) process.exit(code ?? 1);
  assertLocalBuild();
  console.log(`부하 테스트용 빌드 완료: ${LOADTEST_DIST_DIR} (로컬 Supabase 주소 확인함)`);
});
