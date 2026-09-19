$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$stateRoot = Join-Path $env:TEMP 'SafeRoute'
$pidPath = Join-Path $stateRoot 'server.pid'

if (-not (Test-Path $pidPath)) {
  Write-Host 'No SafeRoute launcher-owned server was found.'
  exit 0
}

$serverPid = [int](Get-Content -Path $pidPath -Raw).Trim()
$process = Get-Process -Id $serverPid -ErrorAction SilentlyContinue
if (-not $process) {
  Remove-Item $pidPath -Force
  Write-Host 'The SafeRoute launcher-owned server is not running.'
  exit 0
}

$commandLine = (Get-CimInstance Win32_Process -Filter "ProcessId = $serverPid").CommandLine
if (-not $commandLine -or $commandLine -notmatch 'npm run start:single') {
  throw 'Refusing to stop the process because it does not match this SafeRoute project.'
}

function Get-ProcessTree([int]$processId) {
  $children = Get-CimInstance Win32_Process | Where-Object {
    $_.ParentProcessId -eq $processId
  }

  foreach ($child in $children) {
    $child
    Get-ProcessTree $child.ProcessId
  }
}

$tree = @(Get-ProcessTree $serverPid)
if (-not ($tree.CommandLine -match 'node(\.exe)?\s+server\.js')) {
  throw 'Refusing to stop the process because no SafeRoute server process was found in its process tree.'
}

function Stop-ProcessTree([int]$processId) {
  $children = Get-CimInstance Win32_Process | Where-Object {
    $_.ParentProcessId -eq $processId
  }

  foreach ($child in $children) {
    Stop-ProcessTree $child.ProcessId
  }

  Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
}

Stop-ProcessTree $serverPid
Remove-Item $pidPath -Force
Write-Host 'SafeRoute server stopped.'
