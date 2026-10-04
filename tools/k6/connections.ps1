# 부하 테스트 동안 앱 서버(Node)가 Supabase 게이트웨이(로컬 54321번 포트)에 열어 둔 연결 수를 5초마다 CSV로 남긴다.
# 연결 상태: Established = 지금 열려 있는 연결(요청 중이거나 다음 요청을 위해 대기 중)
#   사용법: powershell -File tools/k6/connections.ps1 -ProcessId <PID> -Seconds 540 -Out tools/k6/reports/<이름>-conn.csv
param(
  [Parameter(Mandatory = $true)][int]$ProcessId,
  [int]$Seconds = 540,
  [int]$Port = 54321,
  [Parameter(Mandatory = $true)][string]$Out
)

"time,established" | Out-File -FilePath $Out -Encoding utf8
$endAt = (Get-Date).AddSeconds($Seconds)

while ((Get-Date) -lt $endAt) {
  $count = @(Get-NetTCPConnection -OwningProcess $ProcessId -RemotePort $Port -State Established -ErrorAction SilentlyContinue).Count
  "$((Get-Date).ToString('HH:mm:ss')),$count" | Out-File -FilePath $Out -Append -Encoding utf8
  Start-Sleep -Seconds 5
}
