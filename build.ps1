# Appointza Full Build Script
# Builds both frontend (React) and backend (.NET) in one run.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $root "appointzabuild\production"
$uiDir = Join-Path $root "appointza-ui-canvas"
$serverDir = Join-Path $root "PlanItNoww_Server\PlanItNoww"
$serverProj = Join-Path $serverDir "PlanItNoww.csproj"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Appointza Full Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── 0. Ensure output folder exists ────────────────────────────────────────────
if (-not (Test-Path $out)) { New-Item -ItemType Directory -Path $out | Out-Null }

# ── 1. Publish backend (PlanItNoww) ──────────────────────────────────────────
Write-Host "[1/3] Publishing backend (PlanItNoww)..." -ForegroundColor Yellow
Set-Location $serverDir
dotnet publish $serverProj -c Release -o $out
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend publish FAILED." -ForegroundColor Red
    exit 1
}
Write-Host "Backend publish done." -ForegroundColor Green
Write-Host ""

# ── 2. Generate production config.js used by BOTH UI + server ─────────────────
# The UI reads window.APP_CONFIG from wwwroot/config.js.
# The server also parses baseurl/templateBaseUrl from appointzabuild/production/(wwwroot/)config.js at startup.
Write-Host "[2/3] Writing production config.js..." -ForegroundColor Yellow

$serverAppSettingsPath = Join-Path $serverDir "appsettings.json"
$serverBaseUrl = "http://localhost:5000"
try {
    if (Test-Path $serverAppSettingsPath) {
        $json = Get-Content $serverAppSettingsPath -Raw | ConvertFrom-Json
        if ($json.ApplicationSettings -and $json.ApplicationSettings.baseUrl) {
            $serverBaseUrl = [string]$json.ApplicationSettings.baseUrl
        }
    }
} catch {
    # Keep fallback base URL
}

$templateBaseUrl = "$serverBaseUrl/template"
$configOutPath = Join-Path $out "config.js"

@"
// Production Configuration (single-origin build).
// IMPORTANT:
// - Ensure the API listens on the same origin as the UI, then set baseurl accordingly.
// - This file is read by the browser (window.APP_CONFIG) and parsed by the .NET server at startup.
window.APP_CONFIG = {
  baseurl: '$serverBaseUrl',
  templateBaseUrl: '$templateBaseUrl',
  production: true,
  debugMode: false,
  googleMapsApiKey: 'AIzaSyCpgFKWRzhotWFPW5smIfAAXxPGGHQMsHQ',
  vapidKey: 'BG6qfOt_h6ujiW_J14D57NDN_B-O2MS5WN-lq6C-d6ZpjJLYUnkBslIonPEnd55Ds-29ph9kU1IZisxaW-IMDBo',
  razorpayKeyId: 'rzp_live_RCRKKPVDZ3tLDv',
  razorpayKeySecret: 'cLvDMGMb9AWeggkxTbs5qZms',
  razorpayTestMode: false,
  appTitle: 'Appointza',
  version: '1.0.0',
  features: {
    enableDebugLogs: false,
    enableAnalytics: true,
    enableErrorReporting: true
  }
};
"@ | Set-Content -Path $configOutPath -Encoding UTF8

Write-Host "config.js written to: $configOutPath" -ForegroundColor Green
Write-Host "baseurl: $serverBaseUrl" -ForegroundColor DarkGray
Write-Host ""

# ── 3. Build frontend (Vite → appointzabuild/production/wwwroot) ──────────────
Write-Host "[3/3] Building frontend (appointza-ui-canvas)..." -ForegroundColor Yellow
Set-Location $uiDir
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build FAILED." -ForegroundColor Red
    exit 1
}
Write-Host "Frontend build done." -ForegroundColor Green
Write-Host ""

# ── Unblock all output files (Windows App Control policy) ────────────────────
Write-Host "Unblocking output files..." -ForegroundColor Yellow
Get-ChildItem -Path "$root\appointzabuild\production" -Recurse -File | Unblock-File
Write-Host "Files unblocked." -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build completed successfully!" -ForegroundColor Green
Write-Host "  Output: appointzabuild\production\" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $root
