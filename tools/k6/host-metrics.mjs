// 이 PC 전체의 CPU·메모리와 k6 프로세스의 CPU를 Prometheus 형식으로 연다(127.0.0.1:9101/metrics).
// 앱·Supabase·k6가 모두 한 PC에서 돌므로, 느려질 때 PC 자체가 꽉 찼는지부터 가려야 한다.
// run.mjs가 부하 테스트 동안만 켠다. Windows 공식 수집기(windows_exporter)를 따로 설치하지 않으려고 직접 만들었다.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import os from "node:os";

export const HOST_METRICS_PORT = 9101;

/** 모든 코어의 CPU 시간을 종류별로 더한다(초). node_exporter의 node_cpu_seconds_total과 같은 뜻. */
function cpuSecondsByMode() {
  const total = { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 };
  for (const cpu of os.cpus()) {
    for (const mode of Object.keys(total)) total[mode] += cpu.times[mode] / 1000;
  }
  return total;
}

/**
 * 다른 프로세스의 누적 CPU 시간을 2초마다 읽는다. Node는 남의 프로세스 CPU를 못 읽어서 PowerShell을 하나 띄워 둔다.
 * findProcess는 그 프로세스를 찾는 PowerShell 식이다. 프로세스가 끝나면 마지막 값을 그대로 둔다.
 * PowerShell이 없는 OS(리눅스·맥)에서는 건너뛰고 PC 전체 지표만 낸다. 수집기가 실패해도 부하 테스트는 계속한다.
 */
function watchProcess(findProcess, onSample) {
  if (process.platform !== "win32") return null;
  const script =
    `$p = ${findProcess}; ` +
    `while (-not $p.HasExited) { $p.Refresh(); ` +
    `'{0} {1}' -f $p.TotalProcessorTime.TotalSeconds, $p.WorkingSet64; Start-Sleep -Seconds 2 }`;
  const child = spawn("powershell", ["-NoProfile", "-Command", script], {
    stdio: ["ignore", "pipe", "ignore"],
  });
  child.on("error", (error) => console.error("프로세스 지표를 읽지 못했습니다:", error.message));
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    for (const line of chunk.split(/\r?\n/)) {
      const [cpu, memory] = line.trim().split(" ").map(Number);
      if (Number.isFinite(cpu) && Number.isFinite(memory)) onSample({ cpu, memory });
    }
  });
  return child;
}

export function startHostMetrics(port = HOST_METRICS_PORT) {
  const processes = new Map();
  const watchers = [];

  const server = createServer((request, response) => {
    if (request.url !== "/metrics") {
      response.writeHead(404).end();
      return;
    }
    const lines = [
      "# HELP host_cpu_seconds_total 이 PC의 모든 코어 CPU 시간 합(종류별)",
      "# TYPE host_cpu_seconds_total counter",
      ...Object.entries(cpuSecondsByMode()).map(
        ([mode, seconds]) => `host_cpu_seconds_total{mode="${mode}"} ${seconds}`
      ),
      "# HELP host_cpu_count 논리 코어 수",
      "# TYPE host_cpu_count gauge",
      `host_cpu_count ${os.cpus().length}`,
      "# HELP host_memory_total_bytes 전체 메모리",
      "# TYPE host_memory_total_bytes gauge",
      `host_memory_total_bytes ${os.totalmem()}`,
      "# HELP host_memory_free_bytes 남은 메모리",
      "# TYPE host_memory_free_bytes gauge",
      `host_memory_free_bytes ${os.freemem()}`,
      "# HELP host_process_cpu_seconds_total 지켜보는 프로세스의 누적 CPU 시간",
      "# TYPE host_process_cpu_seconds_total counter",
      ...[...processes].map(
        ([name, s]) => `host_process_cpu_seconds_total{process="${name}"} ${s.cpu}`
      ),
      "# HELP host_process_memory_bytes 지켜보는 프로세스의 메모리(작업 집합)",
      "# TYPE host_process_memory_bytes gauge",
      ...[...processes].map(
        ([name, s]) => `host_process_memory_bytes{process="${name}"} ${s.memory}`
      ),
    ];
    response.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
    response.end(`${lines.join("\n")}\n`);
  });
  server.on("error", (error) =>
    console.error(`PC 지표 주소(${port})를 열지 못했습니다:`, error.message)
  );
  server.listen(port, "127.0.0.1");

  return {
    /** 이름을 붙여 다른 프로세스의 CPU·메모리도 함께 낸다(예: k6). */
    watch(name, pid) {
      const find = `Get-Process -Id ${Number(pid)} -ErrorAction Stop`;
      watchers.push(watchProcess(find, (sample) => processes.set(name, sample)));
    },
    /** 이 PC에서 그 포트를 열고 기다리는 프로세스(예: 앱 서버)를 찾아 함께 낸다. 이름은 app-<포트>. */
    watchPort(port) {
      const find =
        `Get-Process -Id (Get-NetTCPConnection -LocalPort ${Number(port)} -State Listen ` +
        `-ErrorAction Stop | Select-Object -First 1).OwningProcess -ErrorAction Stop`;
      watchers.push(watchProcess(find, (sample) => processes.set(`app-${port}`, sample)));
    },
    close() {
      for (const watcher of watchers) watcher?.kill();
      server.close();
    },
  };
}
