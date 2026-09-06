# start-backend.ps1 — CUE's one-command backend launcher

$here = $PSScriptRoot
if (-not $here) { $here = (Get-Location).Path }
Push-Location $here

$envFile = Join-Path $here ".env"
if (-not (Test-Path $envFile)) {
  Write-Host "Missing .env" -ForegroundColor Red
  Pop-Location
  exit 1
}

Write-Host "Loading secrets from .env ..." -ForegroundColor DarkCyan
Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -and -not $line.StartsWith("#")) {
    $idx = $line.IndexOf("=")
    if ($idx -gt 0) {
      $key = $line.Substring(0, $idx).Trim()
      $val = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
      [Environment]::SetEnvironmentVariable($key, $val, "Process")
      Write-Host "  set $key" -ForegroundColor DarkGray
    }
  }
}

Write-Host ""
Write-Host "Starting CUE backend on http://localhost:8080 ..." -ForegroundColor Green
$mvnw = Join-Path $here "mvnw.cmd"
& $mvnw spring-boot:run
$code = $LASTEXITCODE
Pop-Location
exit $code