# 부하 테스트 동안 앱 서버(Node 프로세스)의 CPU·메모리를 2초마다 CSV로 남긴다.
# CPU는 코어 하나를 100%로 센다. Node는 화면 그리기를 주로 코어 하나로 처리하므로 100% 근처가 한계 신호다.
#   사용법: powershell -File tools/k6/monitor.ps1 -ProcessId <PID> -Seconds 200 -Out tools/k6/reports/<이름>-node.csv
param(
  [Parameter(Mandatory = $true)][int]$ProcessId,
  [int]$Seconds = 200,
  [Parameter(Mandatory = $true)][string]$Out
)

$process = Get-Process -Id $ProcessId
"time,node_cpu_pct,node_mem_mb" | Out-File -FilePath $Out -Encoding utf8
$previousCpu = $process.TotalProcessorTime.TotalSeconds
$previousAt = Get-Date
$endAt = (Get-Date).AddSeconds($Seconds)

while ((Get-Date) -lt $endAt) {
  Start-Sleep -Milliseconds 2000
  $process.Refresh()
  $now = Get-Date
  $cpu = $process.TotalProcessorTime.TotalSeconds
  $percent = [math]::Round(($cpu - $previousCpu) / ($now - $previousAt).TotalSeconds * 100, 1)
  $memoryMb = [math]::Round($process.WorkingSet64 / 1MB)
  "$($now.ToString('HH:mm:ss')),$percent,$memoryMb" | Out-File -FilePath $Out -Append -Encoding utf8
  $previousCpu = $cpu
  $previousAt = $now
}
