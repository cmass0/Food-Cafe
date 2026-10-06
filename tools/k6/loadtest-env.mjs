// 부하 테스트용 앱이 로컬 Supabase만 가리키게 하는 공통 설정.
// NEXT_PUBLIC_* 값은 빌드할 때 코드에 박힌다. 평소 빌드(.next)로 부하 테스트를 하면 원격 DB에 부하가 갈 수 있으므로,
// 부하 테스트용 빌드는 .env.loadtest.local 값으로 따로 만들어 build/loadtest에 두고 그 빌드만 띄운다.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
// build/는 git·ESLint가 이미 무시하는 폴더다.
// .next 안(.next/loadtest)에 두면 개발 서버 캐시(.next/dev, 수 GB)와 섞여 빌드 중 postcss 처리 프로세스가
// 메모리 할당에 실패하며 죽었다(같은 빌드를 .next 밖에 두면 12초 만에 끝남).
export const LOADTEST_DIST_DIR = "build/loadtest";
const ENV_FILE = ".env.loadtest.local";
const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

/** .env.loadtest.local 값을 읽는다. 로컬 주소가 아니면 멈춘다. 값은 화면에 출력하지 않는다. */
export function readLoadTestEnv() {
  const file = path.join(ROOT, ENV_FILE);
  if (!existsSync(file)) {
    throw new Error(
      `${ENV_FILE}이 없습니다. 로컬 Supabase 값(npx supabase status -o env)으로 만들어 주세요.`
    );
  }
  const values = Object.fromEntries(
    readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?(.*?)"?\s*$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, value])
  );
  const url = values.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !LOCAL_HOSTS.has(new URL(url).hostname)) {
    throw new Error(
      `${ENV_FILE}의 NEXT_PUBLIC_SUPABASE_URL이 이 PC(127.0.0.1)가 아닙니다. 원격 DB 보호를 위해 멈춥니다.`
    );
  }
  return values;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (name.endsWith(".js")) yield full;
  }
}

// 원격 Supabase 프로젝트 주소(<프로젝트>.supabase.co·.supabase.in). supabase.com 같은 문서 주소는 고르지 않는다.
const REMOTE_PROJECT_URL = /[a-z0-9-]+\.supabase\.(?:co|in)(?![a-z0-9-])/i;

/**
 * 부하 테스트용 빌드가 있고, 로컬 Supabase 주소로 만들어졌는지 확인한다.
 * NEXT_PUBLIC_* 값은 브라우저용(static)과 서버용(server) 코드에 모두 박힌다. 부하 테스트의 DB 요청은 대부분
 * 서버에서 나가므로 둘 다 본다. 원격 프로젝트 주소가 하나라도 있거나, 어느 쪽에서든 로컬 주소를 못 찾으면 멈춘다.
 * 사용자 지정 도메인은 모양으로 알아볼 수 없어서, 로컬 주소가 실제로 박혀 있는지로 대신 확인한다.
 */
export function assertLocalBuild() {
  const distDir = path.join(ROOT, LOADTEST_DIST_DIR);
  if (!existsSync(path.join(distDir, "BUILD_ID"))) {
    throw new Error(
      `부하 테스트용 빌드가 없습니다. node tools/k6/build-app.mjs 로 먼저 빌드하세요.`
    );
  }
  const localUrl = readLoadTestEnv().NEXT_PUBLIC_SUPABASE_URL;
  for (const area of ["static", "server"]) {
    let hasLocalUrl = false;
    for (const file of walk(path.join(distDir, area))) {
      const code = readFileSync(file, "utf8");
      // 29MB 남짓을 매번 정규식으로 훑으면 느려서, 후보 파일만 정규식으로 본다.
      if (code.includes(".supabase.") && REMOTE_PROJECT_URL.test(code)) {
        throw new Error(
          `부하 테스트용 빌드에 원격 Supabase 주소가 들어 있습니다(${path.relative(ROOT, file)}). 다시 빌드하세요.`
        );
      }
      hasLocalUrl ||= code.includes(localUrl);
    }
    if (!hasLocalUrl) {
      throw new Error(
        `부하 테스트용 빌드(${area})에서 로컬 Supabase 주소를 찾지 못했습니다. 다시 빌드하세요.`
      );
    }
  }
}
