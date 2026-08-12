# buildallacw.ps1 - Build Appointza + Campusza + Webzys UIs and publish the .NET server
#
# Output:
#   appointzabuild/production/
#     appointza.exe, appsettings.json, config.js
#     wwwroot/appointza, wwwroot/campusza, wwwroot/webzys, wwwroot/stay
#
# Usage:
#   .\buildallacw.ps1
#   .\buildallacw.ps1 -SkipServer
#   .\buildallacw.ps1 -SkipUi
#   .\buildallacw.cmd

#Requires -Version 5.1

param(
    [switch]$SkipServer,
    [switch]$SkipUi,
    [string]$ApiBaseUrl = ""
)

$ErrorActionPreference = "Stop"

$root = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }
$out = Join-Path $root "appointzabuild\production"
$wwwroot = Join-Path $out "wwwroot"

$uiProjects = @(
    @{ Name = "Appointza"; Folder = "appointza-ui-canvas"; Segment = "appointza"; BasePath = "/appointza/" },
    @{ Name = "Campusza";  Folder = "campusza";           Segment = "campusza";  BasePath = "/campusza/" },
    @{ Name = "AppointzaStay"; Folder = "appointzastay"; Segment = "stay"; BasePath = "/stay/" },
    @{ Name = "Webzys";    Folder = "Webzys";             Segment = "webzys";    BasePath = "/webzys/" }
)

$serverDir = Join-Path $root "appointza\appointza"
$serverProj = Join-Path $serverDir "appointza.csproj"

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
        if (Test-Path "package-lock.json") {
            & npm ci
        } else {
            & npm install
        }
        if (-not $?) { throw "npm install failed in $ProjectPath" }
    } finally {
        Pop-Location
    }
}

function Copy-DistToWwwRoot([string]$DistPath, [string]$TargetPath) {
    if (-not (Test-Path $DistPath)) {
        throw "Build output not found: $DistPath"
    }
    if (Test-Path $TargetPath) {
        Remove-Item -Path $TargetPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $TargetPath -Force | Out-Null
    Copy-Item -Path (Join-Path $DistPath "*") -Destination $TargetPath -Recurse -Force
}

function Invoke-ViteBuild([string]$ProjectPath, [string]$BasePath) {
    Push-Location $ProjectPath
    try {
        Write-Host "Building with base $BasePath ..." -ForegroundColor Yellow
        # Quote base path - PowerShell treats /x/ as division without quotes
        & npx vite build --mode production --base "$BasePath" --outDir dist --emptyOutDir
        if (-not $?) { throw "vite build failed in $ProjectPath" }
    } finally {
        Pop-Location
    }
}

function Write-ProductionConfig([string]$BaseUrl) {
    $resolvedBase = $BaseUrl.TrimEnd("/")
    if ([string]::IsNullOrWhiteSpace($resolvedBase)) {
        $serverAppSettingsPath = Join-Path $serverDir "appsettings.json"
        $resolvedBase = "https://appointza.com"
        try {
            if (Test-Path $serverAppSettingsPath) {
                $json = Get-Content $serverAppSettingsPath -Raw | ConvertFrom-Json
                if ($json.ApplicationSettings.baseUrl) {
                    $resolvedBase = [string]$json.ApplicationSettings.baseUrl.TrimEnd("/")
                }
            }
        } catch {
            # keep default
        }
    }

    $templateBaseUrl = "$resolvedBase/template"
    $configJs = @"
// Production config - read by Appointza UI and parsed by the .NET server at startup.
window.APP_CONFIG = {
  baseurl: '$resolvedBase',
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
"@

    if (-not (Test-Path $out)) {
        New-Item -ItemType Directory -Path $out -Force | Out-Null
    }
    if (-not (Test-Path $wwwroot)) {
        New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
    }

    $configJs | Set-Content -Path (Join-Path $out "config.js") -Encoding UTF8
    $configJs | Set-Content -Path (Join-Path $wwwroot "config.js") -Encoding UTF8

    Write-Host "config.js written (baseurl: $resolvedBase)" -ForegroundColor Green
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

    Write-Step "ACW build - Appointza + Campusza + Webzys"

    if (-not $SkipUi) {
        Write-ProductionConfig -BaseUrl $ApiBaseUrl

        foreach ($ui in $uiProjects) {
            Write-Step ("UI: {0} -> wwwroot/{1}" -f $ui.Name, $ui.Segment)
            $projectPath = Join-Path $root $ui.Folder
            if (-not (Test-Path $projectPath)) {
                throw "UI project folder not found: $projectPath"
            }

            Install-NpmIfNeeded -ProjectPath $projectPath
            Invoke-ViteBuild -ProjectPath $projectPath -BasePath $ui.BasePath

            $dist = Join-Path $projectPath "dist"
            $target = Join-Path $wwwroot $ui.Segment
            Copy-DistToWwwRoot -DistPath $dist -TargetPath $target
            Write-Host ("{0} copied to {1}" -f $ui.Name, $target) -ForegroundColor Green

            if ($ui.Segment -eq "appointza") {
                $rootConfig = Join-Path $out "config.js"
                if (Test-Path $rootConfig) {
                    Copy-Item -Path $rootConfig -Destination (Join-Path $target "config.js") -Force
                }
            } else {
                # Stay / Campusza / Webzys: ship config.prod.js as config.js in the SPA folder
                $prodConfig = Join-Path $projectPath "public\config.prod.js"
                if (Test-Path $prodConfig) {
                    Copy-Item -Path $prodConfig -Destination (Join-Path $target "config.js") -Force
                }
            }
        }

        Write-Host ""
        Write-Host "All UI builds copied to appointzabuild\production\wwwroot\" -ForegroundColor Green

        # Root index.html/assets steal /stay/ and /webzys/ via SPA fallback — keep only config.js at wwwroot root.
        foreach ($junk in @("index.html", "assets", "vite.svg", "favicon.ico", "placeholder.svg", "robots.txt")) {
            $junkPath = Join-Path $wwwroot $junk
            if (Test-Path $junkPath) {
                Remove-Item -Path $junkPath -Recurse -Force
                Write-Host "Removed wwwroot/$junk (apps live under wwwroot/{appointza|campusza|webzys|stay}/)" -ForegroundColor Yellow
            }
        }
    }

    if (-not $SkipServer) {
        Write-Step ".NET server -> appointzabuild\production"
        if (-not (Test-Path $serverProj)) {
            throw "Server project not found: $serverProj"
        }

        Stop-RunningServer

        Push-Location $serverDir
        try {
            & dotnet publish $serverProj -c Release
            if (-not $?) { throw "dotnet publish failed" }
        } finally {
            Pop-Location
        }

        Write-Host "Server published to appointzabuild\production\" -ForegroundColor Green
    }

    Write-Step "Build completed"
    Write-Host "Deploy folder: appointzabuild\production\" -ForegroundColor White
    Write-Host "  /appointza  -> Appointza UI" -ForegroundColor DarkGray
    Write-Host "  /campusza   -> Campusza UI" -ForegroundColor DarkGray
    Write-Host "  /stay         -> AppointzaStay UI" -ForegroundColor DarkGray
    Write-Host "  /webzys     -> Webzys UI" -ForegroundColor DarkGray
    Write-Host "  /api        -> shared API" -ForegroundColor DarkGray
    Write-Host ""

    Get-ChildItem -Path $out -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue
    exit 0
}
catch {
    Write-Host ""
    Write-Host "BUILD FAILED:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ScriptStackTrace) {
        Write-Host $_.ScriptStackTrace -ForegroundColor DarkGray
    }
    exit 1
}
finally {
    Set-Location $root
}
