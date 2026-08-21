# Appointza production build (UI + server).
# Config: appointza-ui-canvas/public/config.js
# Output: appointzabuild/appointzaproduction/
#
# Usage: .\build-appointza.ps1

#Requires -Version 5.1

$ErrorActionPreference = "Stop"

$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$uiDir = Join-Path $root "appointza-ui-canvas"
$prodOut = Join-Path $root "appointzabuild\appointzaproduction"
$wwwroot = Join-Path $prodOut "wwwroot"
$configSource = Join-Path $uiDir "public\config.js"

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Resolve-ServerProjectPath {
    $candidates = @(
        (Join-Path $root "appointza\appointza\appointza\appointza.csproj"),
        (Join-Path $root "appointza\appointza\appointza.csproj")
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }
    throw "Server project not found."
}

function Install-NpmIfNeeded([string]$ProjectPath) {
    if (Test-Path (Join-Path $ProjectPath "node_modules")) { return }
    Write-Host "Installing npm packages..." -ForegroundColor Yellow
    Push-Location $ProjectPath
    try {
        if (Test-Path "package-lock.json") { npm ci } else { npm install }
        if (-not $?) { throw "npm install failed" }
    } finally {
        Pop-Location
    }
}

function Stop-RunningServer {
    $proc = Get-Process -Name "appointza" -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping running appointza.exe ..." -ForegroundColor Yellow
        Stop-Process -Name "appointza" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

try {
    Set-Location $root
    if (-not (Test-Path $configSource)) {
        throw "Missing config file: $configSource"
    }

    Write-Step "Appointza build"

    Write-Step "Publish .NET server"
    Stop-RunningServer
    $serverProj = Resolve-ServerProjectPath
    $serverDir = Split-Path -Parent $serverProj
    if (Test-Path $prodOut) {
        Remove-Item -Path $prodOut -Recurse -Force
    }
    Push-Location $serverDir
    try {
        & dotnet publish $serverProj -c Release -o $prodOut
        if (-not $?) { throw "dotnet publish failed" }
    } finally {
        Pop-Location
    }
    if (Test-Path $wwwroot) {
        Remove-Item -Path $wwwroot -Recurse -Force
    }
    New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null

    Write-Step "Build UI (Vite)"
    Install-NpmIfNeeded -ProjectPath $uiDir
    Push-Location $uiDir
    try {
        & npm run build
        if (-not $?) { throw "UI build failed" }
    } finally {
        Pop-Location
    }

    if (-not (Test-Path (Join-Path $wwwroot "index.html"))) {
        throw "Missing wwwroot/index.html after UI build."
    }

    Copy-Item -Path $configSource -Destination (Join-Path $prodOut "config.js") -Force
    Copy-Item -Path $configSource -Destination (Join-Path $wwwroot "config.js") -Force

    @"
@echo off
set ASPNETCORE_URLS=http://localhost:5000
cd /d "%~dp0"
appointza.exe
"@ | Set-Content -Path (Join-Path $prodOut "run.cmd") -Encoding ASCII

    Get-ChildItem -Path $prodOut -Recurse -File -ErrorAction SilentlyContinue |
        Unblock-File -ErrorAction SilentlyContinue

    Write-Step "Build completed"
    Write-Host "Output: $prodOut" -ForegroundColor Green
    Write-Host "Run:    .\appointzabuild\appointzaproduction\run.cmd" -ForegroundColor Cyan
    exit 0
}
catch {
    Write-Host ""
    Write-Host "BUILD FAILED:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
finally {
    Set-Location $root
}
