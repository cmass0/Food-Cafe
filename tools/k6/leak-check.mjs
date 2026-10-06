// 앱 서버 메모리 누수 확인용 통제 실험.
// 같은 페이지를 일정 횟수 요청한 뒤 서버 프로세스 메모리를 재고, 게시글 상세를 한 번 연 다음 다시 반복한다.
//   사용법: node tools/k6/leak-check.mjs <서버 PID> <반복 요청 경로> <게시글 경로> [횟수=1000] [동시=10]
import { execFileSync } from "node:child_process";

const [pid, repeatPath, postPath, countArg, concurrencyArg] = process.argv.slice(2);
const APP = process.env.APP_URL ?? "http://127.0.0.1:3300";
const count = Number(countArg ?? 1000);
const concurrency = Number(concurrencyArg ?? 10);

// Windows 작업 관리자의 "메모리(전용 작업 집합)"에 가까운 값. MB.
function memoryMb() {
  const out = execFileSync(
    "powershell",
    ["-NoProfile", "-Command", `[math]::Round((Get-Process -Id ${pid}).PrivateMemorySize64 / 1MB)`],
    { encoding: "utf8" }
  );
  return Number(out.trim());
}

async function hammer(path) {
  let next = 0;
  const started = performance.now();
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next < count) {
        next++;
        const res = await fetch(`${APP}${path}`);
        await res.arrayBuffer();
      }
    })
  );
  return ((performance.now() - started) / count).toFixed(1);
}

console.log(`시작              메모리 ${memoryMb()}MB`);
let avg = await hammer(repeatPath);
console.log(`${repeatPath} ${count}번 후  메모리 ${memoryMb()}MB (요청당 평균 ${avg}ms)`);
avg = await hammer(repeatPath);
console.log(`${repeatPath} ${count}번 더  메모리 ${memoryMb()}MB (요청당 평균 ${avg}ms)`);

await (await fetch(`${APP}${postPath}`)).arrayBuffer();
console.log(`게시글 상세 1번 연 뒤  메모리 ${memoryMb()}MB`);

avg = await hammer(repeatPath);
console.log(`${repeatPath} ${count}번 후  메모리 ${memoryMb()}MB (요청당 평균 ${avg}ms)`);
avg = await hammer(repeatPath);
console.log(`${repeatPath} ${count}번 더  메모리 ${memoryMb()}MB (요청당 평균 ${avg}ms)`);
