#Requires -Version 5.1
<#
.SYNOPSIS
  Run API + all product UIs on separate ports.

  API        http://localhost:5000
  Webzys     http://localhost:8081
  Appointza  http://localhost:8083
  Campusza   http://localhost:8087
  Stay       http://localhost:8088

.EXAMPLE
  .\run-all.ps1
  .\run-all.ps1 -SkipApi
  .\run-all.ps1 -ApiOnly
#>
param(
    [switch]$SkipApi,
    [switch]$ApiOnly,
    [switch]$SkipUi
)

$ErrorActionPreference = "Stop"
$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }

$apiExe = Join-Path $root "appointzabuild\appointzaproduction\appointza.exe"
if (-not (Test-Path $apiExe)) {
    $apiExe = Join-Path $root "appointzabuild\production\appointza.exe"
}
$serverProj = Join-Path $root "appointza\appointza\appointza.csproj"

$uis = @(
    @{ Name = "Webzys";    Folder = "Webzys";             Port = 8081 },
    @{ Name = "Appointza"; Folder = "appointza-ui-canvas"; Port = 8083 },
    @{ Name = "Campusza";  Folder = "campusza";            Port = 8087 },
    @{ Name = "Stay";      Folder = "appointzastay";       Port = 8088 }
)

function Start-NpmDev([string]$Name, [string]$Folder, [int]$Port) {
    $path = Join-Path $root $Folder
    if (-not (Test-Path $path)) {
        Write-Host "Skip $Name - folder missing: $path" -ForegroundColor Yellow
        return
    }
    if (-not (Test-Path (Join-Path $path "node_modules"))) {
        Write-Host "Installing npm packages for $Name ..." -ForegroundColor Yellow
        Push-Location $path
        try {
            if (Test-Path "package-lock.json") { npm ci } else { npm install }
            if (-not $?) { throw "npm install failed for $Name" }
        } finally {
            Pop-Location
        }
    }

    Write-Host "Starting $Name on http://localhost:$Port ..." -ForegroundColor Cyan
    Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory $path -WindowStyle Normal
}

Write-Host ""
Write-Host "Appointza multi-port local run" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

if (-not $SkipApi) {
    $existing = Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "API already listening on :5000" -ForegroundColor Yellow
    } elseif (Test-Path $apiExe) {
        Write-Host "Starting API: $apiExe (port 5000)" -ForegroundColor Cyan
        Start-Process -FilePath $apiExe -WorkingDirectory (Split-Path $apiExe) -WindowStyle Normal
    } elseif (Test-Path $serverProj) {
        Write-Host "Starting API via dotnet run (http://localhost:5000) ..." -ForegroundColor Cyan
        $serverDir = Split-Path $serverProj
        Start-Process -FilePath "cmd.exe" -ArgumentList @(
            "/c",
            "set ASPNETCORE_URLS=http://localhost:5000& dotnet run --launch-profile appointza"
        ) -WorkingDirectory $serverDir -WindowStyle Normal
    } else {
        Write-Host "API not found (no appointza.exe and no csproj). Start it manually on :5000." -ForegroundColor Red
    }
}

if ($ApiOnly -or $SkipUi) {
    Write-Host "UI skipped." -ForegroundColor DarkGray
    exit 0
}

Start-Sleep -Seconds 2

foreach ($ui in $uis) {
    Start-NpmDev -Name $ui.Name -Folder $ui.Folder -Port $ui.Port
}

Write-Host ""
Write-Host "Open:" -ForegroundColor Green
Write-Host "  API        http://localhost:5000"
Write-Host "  Webzys     http://localhost:8081"
Write-Host "  Appointza  http://localhost:8083"
Write-Host "  Campusza   http://localhost:8087"
Write-Host "  Stay       http://localhost:8088"
Write-Host ""
Write-Host "Each UI proxies /api to http://localhost:5000" -ForegroundColor DarkGray
