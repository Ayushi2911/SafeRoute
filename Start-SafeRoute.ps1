$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverRoot = Join-Path $projectRoot 'server'
$url = 'http://localhost:5000'
$healthUrl = "$url/api/test"
$stateRoot = Join-Path $env:TEMP 'SafeRoute'
$pidPath = Join-Path $stateRoot 'server.pid'
$logPath = Join-Path $stateRoot 'server-launch.log'
$errorLogPath = Join-Path $stateRoot 'server-launch-error.log'

function Test-SafeRouteReady {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 3
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Open-SafeRoute {
  Start-Process $url
}

if (Test-SafeRouteReady) {
  Open-SafeRoute
  exit 0
}

if (-not (Test-Path $serverRoot)) {
  throw "SafeRoute server directory was not found: $serverRoot"
}

New-Item -ItemType Directory -Path $stateRoot -Force | Out-Null
$serverProcess = Start-Process `
  -FilePath $env:ComSpec `
  -ArgumentList '/d', '/c', 'npm run start:single' `
  -WorkingDirectory $serverRoot `
  -RedirectStandardOutput $logPath `
  -RedirectStandardError $errorLogPath `
  -WindowStyle Minimized `
  -PassThru

Set-Content -Path $pidPath -Value $serverProcess.Id -Encoding ASCII

$deadline = (Get-Date).AddSeconds(180)
while ((Get-Date) -lt $deadline) {
  if (Test-SafeRouteReady) {
    Open-SafeRoute
    exit 0
  }

  if ($serverProcess.HasExited) {
    throw "SafeRoute stopped before http://localhost:5000 became available. Review $logPath"
  }

  Start-Sleep -Seconds 2
}

throw "SafeRoute did not become ready within 180 seconds. Review $logPath"
