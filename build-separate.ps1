# build-separate.ps1 - Separate production folder per product (server + wwwroot)
#
# Output under appointzabuild/:
#   appointzabuild/appointzaproduction/   port 5000
#   appointzabuild/stayproduction/        port 5001
#   appointzabuild/campuszaproduction/    port 5002
#   appointzabuild/webzysproduction/      port 5003
#
# Usage:
#   .\build-separate.ps1
#   .\build-separate.ps1 -Product appointza,stay
#   .\build-stay.ps1
#   .\build-separate.ps1 -HostName appointza.com

#Requires -Version 5.1

param(
    [string[]]$Product = @("appointza", "stay", "campusza", "webzys"),
    [switch]$SkipServer,
    [switch]$SkipUi,
    [string]$HostName = "localhost"
)

$ErrorActionPreference = "Stop"

$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$buildRoot = Join-Path $root "appointzabuild"
$stagingDir = Join-Path $buildRoot "_publish-staging"
$serverDir = Join-Path $root "appointza\appointza"
$serverProj = Join-Path $serverDir "appointza.csproj"

$allProducts = @(
    @{
        Id        = "appointza"
        Name      = "Appointza"
        Folder    = "appointza-ui-canvas"
        OutputDir = "appointzaproduction"
        Port      = 5000
        LiveHost  = "appointza.com"
    },
    @{
        Id        = "stay"
        Name      = "Appointza Stay"
        Folder    = "appointzastay"
        OutputDir = "stayproduction"
        Port      = 5001
        LiveHost  = "stay.appointza.com"
    },
    @{
        Id        = "campusza"
        Name      = "Campusza"
        Folder    = "campusza"
        OutputDir = "campuszaproduction"
        Port      = 5002
        LiveHost  = "campusza.appointza.com"
    },
    @{
        Id        = "webzys"
        Name      = "Webzys"
        Folder    = "Webzys"
        OutputDir = "webzysproduction"
        Port      = 5003
        LiveHost  = "webzys.appointza.com"
    }
)

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Install-NpmIfNeeded([string]$ProjectPath) {
    $nodeModules = Join-Path $ProjectPath "node_modules"
    if (Test-Path $nodeModules) { return }

    Write-Host "Installing npm packages in $ProjectPath ..." -ForegroundColor Yellow
    Push-Location $ProjectPath
    try {
        if (Test-Path "package-lock.json") { npm ci } else { npm install }
        if (-not $?) { throw "npm install failed in $ProjectPath" }
    } finally {
        Pop-Location
    }
}

function Invoke-ViteBuild([string]$ProjectPath, [string]$OutDir) {
    Push-Location $ProjectPath
    try {
        Write-Host "vite build -> $OutDir" -ForegroundColor Yellow
        & npx vite build --mode production --base "/" --outDir "$OutDir" --emptyOutDir
        if (-not $?) { throw "vite build failed in $ProjectPath" }
    } finally {
        Pop-Location
    }
}

function Get-ProductOrigin([hashtable]$ProductRow) {
    if ($HostName -eq "localhost") {
        return "http://localhost:$($ProductRow.Port)"
    }
    return "https://$($ProductRow.LiveHost)"
}

function Write-ProductConfig([hashtable]$ProductRow, [string]$ProdOut) {
    $origin = Get-ProductOrigin $ProductRow
    $wwwroot = Join-Path $ProdOut "wwwroot"

    $extra = ""
    switch ($ProductRow.Id) {
        "appointza" {
            $domain = if ($HostName -eq "localhost") { "localhost:$($ProductRow.Port)" } else { $ProductRow.LiveHost }
            $extra = @"
  uiBaseUrl: '$origin',
  marketingDomain: 'appointza.com',
  domainname: '$domain',
"@
        }
        "stay" {
            $suffix = if ($HostName -eq "localhost") { "localhost:$($ProductRow.Port)" } else { $ProductRow.LiveHost }
            $extra = "  domainSuffix: '$suffix',"
        }
    }

    $configJs = @"
// $($ProductRow.Name) production
window.APP_CONFIG = {
  baseurl: '$origin',
  templateBaseUrl: '$origin/template',
$extra
  production: true,
  debugMode: false,
  appTitle: '$($ProductRow.Name)',
  version: '1.0.0',
  features: {
    enableDebugLogs: false,
    enableAnalytics: true,
    enableErrorReporting: true
  }
};
"@

    $configJs | Set-Content -Path (Join-Path $ProdOut "config.js") -Encoding UTF8
    if (Test-Path $wwwroot) {
        $configJs | Set-Content -Path (Join-Path $wwwroot "config.js") -Encoding UTF8
    }
    Write-Host "config.js -> $origin" -ForegroundColor Green
}

function Write-ProductRunScript([hashtable]$ProductRow, [string]$ProdOut) {
    $runPs1 = @"
# $($ProductRow.Name) — server + wwwroot on port $($ProductRow.Port)
`$env:ASPNETCORE_URLS = "http://localhost:$($ProductRow.Port)"
Set-Location `$PSScriptRoot
& ".\appointza.exe"
"@
    $runPs1 | Set-Content -Path (Join-Path $ProdOut "run.ps1") -Encoding UTF8

    $runCmd = @"
@echo off
set ASPNETCORE_URLS=http://localhost:$($ProductRow.Port)
cd /d "%~dp0"
appointza.exe
"@
    $runCmd | Set-Content -Path (Join-Path $ProdOut "run.cmd") -Encoding ASCII
}

function Stop-RunningServer {
    $proc = Get-Process -Name "appointza" -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Stopping running appointza.exe ..." -ForegroundColor Yellow
        Stop-Process -Name "appointza" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

function Copy-ServerStaging([string]$ProdOut) {
    if (-not (Test-Path $stagingDir)) {
        throw "Server staging not found: $stagingDir"
    }
    if (Test-Path $ProdOut) {
        Remove-Item -Path $ProdOut -Recurse -Force
    }
    Copy-Item -Path $stagingDir -Destination $ProdOut -Recurse -Force
    $wwwrootPath = Join-Path $ProdOut "wwwroot"
    if (Test-Path $wwwrootPath) {
        Remove-Item -Path $wwwrootPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $wwwrootPath -Force | Out-Null
}

function Publish-ServerOnce {
    if (-not (Test-Path $serverProj)) {
        throw "Server project not found: $serverProj"
    }
    Stop-RunningServer
    if (Test-Path $stagingDir) {
        Remove-Item -Path $stagingDir -Recurse -Force
    }
    Push-Location $serverDir
    try {
        Write-Host "Publishing server to $stagingDir ..." -ForegroundColor Yellow
        & dotnet publish $serverProj -c Release -o $stagingDir
        if (-not $?) { throw "dotnet publish failed" }
    } finally {
        Pop-Location
    }
}

try {
    Set-Location $root
    if (-not (Test-Path $buildRoot)) {
        New-Item -ItemType Directory -Path $buildRoot -Force | Out-Null
    }

    $selectedIds = $Product | ForEach-Object { $_.Trim().ToLower() } | Where-Object { $_ }
    $selected = $allProducts | Where-Object { $selectedIds -contains $_.Id }
    if ($selected.Count -eq 0) {
        throw "No products matched. Use: appointza, stay, campusza, webzys"
    }

    Write-Step "Separate production build ($($selected.Count) product(s))"

    if (-not $SkipServer) {
        Write-Step "Publish .NET server (once)"
        Publish-ServerOnce
    } elseif (-not (Test-Path (Join-Path $stagingDir "appointza.exe"))) {
        $fallback = Join-Path $buildRoot "appointzaproduction\appointza.exe"
        if (Test-Path $fallback) {
            Write-Host "Using appointzabuild/appointzaproduction as staging source" -ForegroundColor Yellow
            Copy-Item -Path (Join-Path $buildRoot "appointzaproduction") -Destination $stagingDir -Recurse -Force
        } else {
            throw "No server build found. Run without -SkipServer first."
        }
    }

    foreach ($productRow in $selected) {
        Write-Step "$($productRow.Name) -> $($productRow.OutputDir)"

        $projectPath = Join-Path $root $productRow.Folder
        if (-not (Test-Path $projectPath)) {
            throw "UI project not found: $projectPath"
        }

        $prodOut = Join-Path $buildRoot $productRow.OutputDir
        $wwwroot = Join-Path $prodOut "wwwroot"

        if (-not $SkipServer) {
            Copy-ServerStaging -ProdOut $prodOut
        } elseif (-not (Test-Path (Join-Path $prodOut "appointza.exe"))) {
            Copy-ServerStaging -ProdOut $prodOut
        } else {
            if (Test-Path $wwwroot) {
                Remove-Item -Path $wwwroot -Recurse -Force
            }
            New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
        }

        if (-not $SkipUi) {
            Install-NpmIfNeeded -ProjectPath $projectPath
            Invoke-ViteBuild -ProjectPath $projectPath -OutDir $wwwroot
        }

        if (-not (Test-Path (Join-Path $wwwroot "index.html"))) {
            throw "Missing wwwroot/index.html in $($productRow.OutputDir)"
        }

        Write-ProductConfig -ProductRow $productRow -ProdOut $prodOut
        Write-ProductRunScript -ProductRow $productRow -ProdOut $prodOut

        Write-Host "$($productRow.Name) -> $prodOut (port $($productRow.Port))" -ForegroundColor Green
    }

    if (-not $SkipServer -and (Test-Path $stagingDir)) {
        Remove-Item -Path $stagingDir -Recurse -Force -ErrorAction SilentlyContinue
    }

    Write-Step "Build completed"
    Write-Host "Deploy folders:" -ForegroundColor Green
    foreach ($productRow in $selected) {
        $origin = Get-ProductOrigin $productRow
        Write-Host "  appointzabuild/$($productRow.OutputDir)/  ->  $origin" -ForegroundColor White
        Write-Host "    appointza.exe + wwwroot/index.html" -ForegroundColor DarkGray
    }
    Write-Host ""
    Write-Host "Run all:  .\run-all-production.ps1" -ForegroundColor Cyan
    Write-Host "Run one:  .\appointzabuild\stayproduction\run.cmd" -ForegroundColor Cyan

    foreach ($productRow in $selected) {
        $prodOut = Join-Path $buildRoot $productRow.OutputDir
        Get-ChildItem -Path $prodOut -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue
    }
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
